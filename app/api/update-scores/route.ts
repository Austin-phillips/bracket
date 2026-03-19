import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchTournamentGames, normalizeTeamName, ESPNGame } from '@/lib/espn'
import { sendSlackMessage } from '@/lib/slack'
import { TEAM_NAME_ALIASES, ROUND_NAMES } from '@/lib/constants'
import { generateGameMessage } from '@/lib/messages'
import { Team } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Authenticate cron requests
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // No secret configured = allow all (dev mode)
  const key = req.nextUrl.searchParams.get('key')
  const authHeader = req.headers.get('authorization')
  return key === secret || authHeader === `Bearer ${secret}`
}

// Find a team in our DB matching an ESPN team name/id
function findMatchingTeam(
  espnName: string,
  espnId: string,
  teams: Team[]
): Team | null {
  // 1. Try exact espn_id match
  const byId = teams.find((t) => t.espn_id === espnId)
  if (byId) return byId

  // 2. Try exact name match
  const byName = teams.find(
    (t) => t.name.toLowerCase() === espnName.toLowerCase() ||
           t.display_name.toLowerCase() === espnName.toLowerCase()
  )
  if (byName) return byName

  // 3. Try alias match
  for (const team of teams) {
    const aliases = TEAM_NAME_ALIASES[team.name] ?? []
    if (aliases.some((a) => a.toLowerCase() === espnName.toLowerCase())) {
      return team
    }
  }

  // 4. Try normalized fuzzy match
  const normalizedEspn = normalizeTeamName(espnName)
  for (const team of teams) {
    if (normalizeTeamName(team.name) === normalizedEspn) return team
    if (normalizeTeamName(team.display_name) === normalizedEspn) return team
    const aliases = TEAM_NAME_ALIASES[team.name] ?? []
    if (aliases.some((a) => normalizeTeamName(a) === normalizedEspn)) return team
  }

  return null
}

// Determine the tournament round from the game date
function detectRound(gameDate: string): number {
  const d = new Date(gameDate)
  const month = d.getMonth() + 1
  const day = d.getDate()

  // 2026 tournament dates (approximate)
  if (month === 3 && day <= 18) return 0  // First Four: Mar 17-18
  if (month === 3 && day <= 22) return 1  // Round of 64: Mar 20-21
  if (month === 3 && day <= 24) return 2  // Round of 32: Mar 22-23
  if (month === 3 && day <= 28) return 3  // Sweet 16: Mar 27-28
  if (month === 3 && day <= 30) return 4  // Elite 8: Mar 29-30
  if (month === 4 && day <= 5) return 5   // Final Four: Apr 4
  return 6                                 // Championship: Apr 6
}


export async function GET(req: NextRequest) {
  const startTime = Date.now()
  console.log('[PROD] === Update scores endpoint hit ===')

  if (!isAuthorized(req)) {
    console.log('[PROD] Unauthorized request — rejecting')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getSupabaseAdmin()

    // Fetch all data upfront: teams, existing games, and picks
    console.log('[PROD] Fetching teams, existing games, and picks...')
    const [
      { data: teams, error: teamsErr },
      { data: existingGames, error: gamesErr },
      { data: allPicks, error: picksErr },
    ] = await Promise.all([
      db.from('teams').select('*'),
      db.from('games').select('espn_game_id, status, message_id'),
      db.from('picks').select('player_name, team_id'),
    ])
    if (teamsErr) throw teamsErr
    if (gamesErr) throw gamesErr
    if (picksErr) throw picksErr

    console.log(`[PROD] Teams: ${teams?.length ?? 0}, Existing games: ${existingGames?.length ?? 0}, Picks: ${allPicks?.length ?? 0}`)

    const processedFinals = new Set(
      existingGames
        ?.filter((g) => g.status === 'final')
        .map((g) => g.espn_game_id) ?? []
    )
    console.log(`[PROD] Already-processed finals: ${processedFinals.size}`)

    // Load all previously used message IDs so we never repeat
    const usedMessageIds = new Set(
      existingGames
        ?.map((g) => g.message_id)
        .filter(Boolean) as string[] ?? []
    )
    console.log(`[PROD] Used message IDs: ${usedMessageIds.size}`)

    // Fetch games from ESPN
    console.log('[PROD] Fetching tournament games from ESPN...')
    const espnGames = await fetchTournamentGames()
    console.log(`[PROD] ESPN returned ${espnGames.length} games`)

    const uniqueGames = new Map<string, ESPNGame>()
    for (const g of espnGames) {
      uniqueGames.set(g.gameId, g)
    }
    console.log(`[PROD] Unique games after dedup: ${uniqueGames.size}`)

    // Log summary of ESPN game statuses
    let completedCount = 0
    let inProgressCount = 0
    let scheduledCount = 0
    for (const g of uniqueGames.values()) {
      if (g.completed) completedCount++
      else if (g.date) scheduledCount++
      else inProgressCount++
    }
    console.log(`[PROD] ESPN game statuses — completed: ${completedCount}, in-progress: ${inProgressCount}, scheduled: ${scheduledCount}`)

    let newResults = 0
    let updatedTeams = 0
    let skippedAlreadyProcessed = 0
    let skippedNotCompleted = 0
    let skippedFirstFour = 0
    let skippedNoMatch = 0
    const slackMessages: { text: string; espnGameId: string; messageId: string }[] = []

    for (const game of uniqueGames.values()) {
      // Skip games we've already fully processed
      if (processedFinals.has(game.gameId)) {
        skippedAlreadyProcessed++
        continue
      }
      if (!game.completed) {
        skippedNotCompleted++
        continue
      }

      // Skip First Four games — only count Round of 64 onward
      const round = detectRound(game.date)
      if (round === 0) {
        skippedFirstFour++
        console.log(`[PROD] Skipping First Four game: ${game.gameId}`)
        continue
      }

      // Find the winner and loser
      const winnerEspn = game.team1.winner ? game.team1 : game.team2
      const loserEspn = game.team1.winner ? game.team2 : game.team1

      const winnerTeam = findMatchingTeam(winnerEspn.displayName, winnerEspn.espnId, teams!)
      const loserTeam = findMatchingTeam(loserEspn.displayName, loserEspn.espnId, teams!)

      if (!winnerTeam || !loserTeam) {
        skippedNoMatch++
        console.warn(
          `[PROD] Could not match teams for game ${game.gameId}: ` +
          `winner="${winnerEspn.displayName}" (espnId=${winnerEspn.espnId}) → ${winnerTeam ? 'matched' : 'NO MATCH'}, ` +
          `loser="${loserEspn.displayName}" (espnId=${loserEspn.espnId}) → ${loserTeam ? 'matched' : 'NO MATCH'}`
        )
        continue
      }

      console.log(
        `[PROD] New final: ${winnerTeam.display_name} (${winnerTeam.seed}) ${winnerEspn.score} - ` +
        `${loserTeam.display_name} (${loserTeam.seed}) ${loserEspn.score} | Round ${round} | ESPN ID: ${game.gameId}`
      )

      // Upsert the game record
      const { error: upsertErr } = await db.from('games').upsert(
        {
          espn_game_id: game.gameId,
          round,
          winner_team_id: winnerTeam.id,
          loser_team_id: loserTeam.id,
          winner_score: parseInt(winnerEspn.score) || 0,
          loser_score: parseInt(loserEspn.score) || 0,
          status: 'final',
          game_date: game.date,
          slack_notified: false,
        },
        { onConflict: 'espn_game_id' }
      )
      if (upsertErr) {
        console.error(`[PROD] Game upsert FAILED for ${game.gameId}:`, upsertErr)
        continue
      }
      console.log(`[PROD] Game ${game.gameId} upserted successfully`)

      // Update winner: increment wins, store ESPN ID
      await db
        .from('teams')
        .update({
          wins: winnerTeam.wins + 1,
          espn_id: winnerEspn.espnId,
        })
        .eq('id', winnerTeam.id)
      console.log(`[PROD] ${winnerTeam.display_name}: wins ${winnerTeam.wins} → ${winnerTeam.wins + 1}`)

      // Update loser: mark eliminated, store ESPN ID
      await db
        .from('teams')
        .update({
          is_eliminated: true,
          espn_id: loserEspn.espnId,
        })
        .eq('id', loserTeam.id)
      console.log(`[PROD] ${loserTeam.display_name}: eliminated`)

      // Update local state for subsequent iterations
      winnerTeam.wins += 1
      winnerTeam.espn_id = winnerEspn.espnId
      loserTeam.is_eliminated = true
      loserTeam.espn_id = loserEspn.espnId

      newResults++
      updatedTeams += 2

      // Find which players are affected (from in-memory picks)
      const winnerPlayers = allPicks!.filter((p) => p.team_id === winnerTeam.id).map((p) => p.player_name)
      const loserPlayers = allPicks!.filter((p) => p.team_id === loserTeam.id).map((p) => p.player_name)
      console.log(`[PROD] Winner picked by: ${winnerPlayers.join(', ') || 'nobody'}`)
      console.log(`[PROD] Loser picked by: ${loserPlayers.join(', ') || 'nobody'}`)

      const roundName = ROUND_NAMES[round] ?? `Round ${round}`

      // Generate a unique funny message (never repeats)
      const { text, messageId } = generateGameMessage(
        {
          winnerTeam: winnerTeam.display_name,
          loserTeam: loserTeam.display_name,
          winnerScore: winnerEspn.score,
          loserScore: loserEspn.score,
          winnerSeed: winnerTeam.seed,
          loserSeed: loserTeam.seed,
          winnerPlayers,
          loserPlayers,
          round: roundName,
        },
        usedMessageIds
      )
      console.log(`[PROD] Generated message ID: ${messageId}`)

      slackMessages.push({ text, espnGameId: game.gameId, messageId })
    }

    console.log(
      `[PROD] Processing summary — new: ${newResults}, already processed: ${skippedAlreadyProcessed}, ` +
      `not completed: ${skippedNotCompleted}, first four: ${skippedFirstFour}, no match: ${skippedNoMatch}`
    )

    // Send Slack notifications — each game result combined with standings
    if (slackMessages.length > 0) {
      console.log(`[PROD] Sending ${slackMessages.length} Slack notification(s)...`)

      for (const msg of slackMessages) {
        console.log(`[PROD] Sending Slack message for game ${msg.espnGameId}...`)
        const slackResult = await sendSlackMessage(msg.text)
        console.log(`[PROD] Slack result: ok=${slackResult.ok} status=${slackResult.status}${slackResult.error ? ' error=' + slackResult.error : ''}`)

        await db
          .from('games')
          .update({ slack_notified: true, message_id: msg.messageId })
          .eq('espn_game_id', msg.espnGameId)
        console.log(`[PROD] Marked ${msg.espnGameId} as slack_notified with message_id=${msg.messageId}`)
      }
    } else {
      console.log('[PROD] No new games to notify about')
    }

    const elapsed = Date.now() - startTime
    console.log(`[PROD] === Done in ${elapsed}ms. New results: ${newResults}, Games checked: ${uniqueGames.size} ===`)

    return NextResponse.json({
      success: true,
      newResults,
      updatedTeams,
      gamesChecked: uniqueGames.size,
      elapsed: `${elapsed}ms`,
    })
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error(`[PROD] === FAILED after ${elapsed}ms ===`, error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
