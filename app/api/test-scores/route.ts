import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizeTeamName, ESPNGame } from '@/lib/espn'
import { sendSlackMessage } from '@/lib/slack'
import { TEAM_NAME_ALIASES, ROUND_NAMES } from '@/lib/constants'
import { generateGameMessage, generateStandingsMessage } from '@/lib/messages'
import { Team } from '@/lib/types'

export const dynamic = 'force-dynamic'

// ── Mock ESPN data ──────────────────────────────────────────────────────────
// These simulate completed ESPN games using real bracket teams.
// Use ?game=N to control how many are "completed" (1-10).
const MOCK_ESPN_GAMES: {
  winnerName: string; loserName: string
  winnerScore: string; loserScore: string
  round: number; date: string
}[] = [
  { winnerName: 'Michigan', loserName: 'Siena', winnerScore: '88', loserScore: '55', round: 1, date: '2026-03-20T19:00:00Z' },
  { winnerName: 'Northern Iowa', loserName: 'Texas Tech', winnerScore: '72', loserScore: '68', round: 1, date: '2026-03-20T21:00:00Z' },
  { winnerName: 'Georgia', loserName: 'TCU', winnerScore: '65', loserScore: '63', round: 1, date: '2026-03-20T23:00:00Z' },
  { winnerName: 'Iowa State', loserName: 'Queens', winnerScore: '95', loserScore: '58', round: 1, date: '2026-03-21T12:00:00Z' },
  { winnerName: 'Gonzaga', loserName: 'Tennessee', winnerScore: '77', loserScore: '74', round: 2, date: '2026-03-22T14:00:00Z' },
  { winnerName: 'VCU', loserName: 'Virginia', winnerScore: '81', loserScore: '76', round: 2, date: '2026-03-22T16:00:00Z' },
  { winnerName: 'Saint Louis', loserName: 'Villanova', winnerScore: '70', loserScore: '66', round: 1, date: '2026-03-21T14:00:00Z' },
  { winnerName: 'Missouri', loserName: 'UCLA', winnerScore: '69', loserScore: '67', round: 1, date: '2026-03-21T16:00:00Z' },
  { winnerName: 'CA Baptist', loserName: 'Arkansas', winnerScore: '82', loserScore: '59', round: 1, date: '2026-03-21T18:00:00Z' },
  { winnerName: 'Missouri', loserName: 'Purdue', winnerScore: '71', loserScore: '70', round: 2, date: '2026-03-22T18:00:00Z' },
]

// Convert our mock data into ESPNGame[] format, exactly like prod receives
function getMockESPNGames(count: number): ESPNGame[] {
  return MOCK_ESPN_GAMES.slice(0, count).map((m, i) => ({
    gameId: `test-${i + 1}`,
    status: 'final' as const,
    completed: true,
    date: m.date,
    team1: {
      name: m.winnerName,
      displayName: m.winnerName,
      abbreviation: '',
      score: m.winnerScore,
      winner: true,
      espnId: `test-espn-${i * 2}`,
    },
    team2: {
      name: m.loserName,
      displayName: m.loserName,
      abbreviation: '',
      score: m.loserScore,
      winner: false,
      espnId: `test-espn-${i * 2 + 1}`,
    },
  }))
}

// ── Identical to prod: findMatchingTeam ─────────────────────────────────────
function findMatchingTeam(
  espnName: string,
  espnId: string,
  teams: Team[]
): Team | null {
  const byId = teams.find((t) => t.espn_id === espnId)
  if (byId) return byId

  const byName = teams.find(
    (t) => t.name.toLowerCase() === espnName.toLowerCase() ||
           t.display_name.toLowerCase() === espnName.toLowerCase()
  )
  if (byName) return byName

  for (const team of teams) {
    const aliases = TEAM_NAME_ALIASES[team.name] ?? []
    if (aliases.some((a) => a.toLowerCase() === espnName.toLowerCase())) {
      return team
    }
  }

  const normalizedEspn = normalizeTeamName(espnName)
  for (const team of teams) {
    if (normalizeTeamName(team.name) === normalizedEspn) return team
    if (normalizeTeamName(team.display_name) === normalizedEspn) return team
    const aliases = TEAM_NAME_ALIASES[team.name] ?? []
    if (aliases.some((a) => normalizeTeamName(a) === normalizedEspn)) return team
  }

  return null
}

// ── Identical to prod: detectRound ──────────────────────────────────────────
function detectRound(gameDate: string): number {
  const d = new Date(gameDate)
  const month = d.getMonth() + 1
  const day = d.getDate()

  if (month === 3 && day <= 19) return 0
  if (month === 3 && day <= 22) return 1
  if (month === 3 && day <= 24) return 2
  if (month === 3 && day <= 28) return 3
  if (month === 3 && day <= 30) return 4
  if (month === 4 && day <= 5) return 5
  return 6
}

// ── Main handler: identical flow to prod, mock ESPN data ────────────────────
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  console.log('[TEST] === Test scores endpoint hit ===')

  // Require ?game=N param (how many mock games are "completed")
  const gameParam = req.nextUrl.searchParams.get('game')
  const gameCount = gameParam ? parseInt(gameParam) : null

  if (!gameCount || gameCount < 1 || gameCount > MOCK_ESPN_GAMES.length) {
    return NextResponse.json({
      error: `Provide ?game=N where N is 1-${MOCK_ESPN_GAMES.length}`,
      usage: `${req.nextUrl.origin}/api/test-scores?game=1`,
      hint: 'N = how many mock games are completed. Hit ?game=1 first, then ?game=2, etc.',
      totalGames: MOCK_ESPN_GAMES.length,
    }, { status: 400 })
  }

  console.log(`[TEST] Simulating ${gameCount} completed ESPN games`)

  try {
    const db = getSupabaseAdmin()

    // ── Step 1: Read all data upfront (same as prod) ──────────────────────
    console.log('[TEST] Fetching teams and existing games...')
    const [
      { data: teams, error: teamsErr },
      { data: existingGames, error: gamesErr },
    ] = await Promise.all([
      db.from('teams').select('*'),
      db.from('games').select('espn_game_id, status, message_id'),
    ])
    if (teamsErr) throw teamsErr
    if (gamesErr) throw gamesErr

    console.log(`[TEST] Teams loaded: ${teams?.length ?? 0}`)
    console.log(`[TEST] Existing games in DB: ${existingGames?.length ?? 0}`)

    const processedFinals = new Set(
      existingGames
        ?.filter((g) => g.status === 'final')
        .map((g) => g.espn_game_id) ?? []
    )
    console.log(`[TEST] Already-processed finals: ${processedFinals.size}`)

    const usedMessageIds = new Set(
      existingGames
        ?.map((g) => g.message_id)
        .filter(Boolean) as string[] ?? []
    )
    console.log(`[TEST] Used message IDs: ${usedMessageIds.size}`)

    // ── Step 2: Get mock ESPN games (replaces fetchTournamentGames) ───────
    const espnGames = getMockESPNGames(gameCount)
    console.log(`[TEST] Mock ESPN returned ${espnGames.length} completed games`)

    const uniqueGames = new Map<string, ESPNGame>()
    for (const g of espnGames) {
      uniqueGames.set(g.gameId, g)
    }

    // ── Step 3: Process games (identical to prod) ─────────────────────────
    let newResults = 0
    let updatedTeams = 0
    let skippedAlreadyProcessed = 0
    let skippedNotCompleted = 0
    let skippedFirstFour = 0
    let skippedNoMatch = 0
    const slackMessages: { text: string; espnGameId: string; messageId: string }[] = []

    for (const game of uniqueGames.values()) {
      if (processedFinals.has(game.gameId)) {
        skippedAlreadyProcessed++
        continue
      }
      if (!game.completed) {
        skippedNotCompleted++
        continue
      }

      const round = detectRound(game.date)
      if (round === 0) {
        skippedFirstFour++
        console.log(`[TEST] Skipping First Four game: ${game.gameId}`)
        continue
      }

      const winnerEspn = game.team1.winner ? game.team1 : game.team2
      const loserEspn = game.team1.winner ? game.team2 : game.team1

      const winnerTeam = findMatchingTeam(winnerEspn.displayName, winnerEspn.espnId, teams!)
      const loserTeam = findMatchingTeam(loserEspn.displayName, loserEspn.espnId, teams!)

      if (!winnerTeam || !loserTeam) {
        skippedNoMatch++
        console.warn(
          `[TEST] Could not match teams for game ${game.gameId}: ` +
          `winner="${winnerEspn.displayName}" → ${winnerTeam ? 'matched' : 'NO MATCH'}, ` +
          `loser="${loserEspn.displayName}" → ${loserTeam ? 'matched' : 'NO MATCH'}`
        )
        continue
      }

      console.log(
        `[TEST] New final: ${winnerTeam.display_name} (${winnerTeam.seed}) ${winnerEspn.score} - ` +
        `${loserTeam.display_name} (${loserTeam.seed}) ${loserEspn.score} | Round ${round} | ID: ${game.gameId}`
      )

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
        console.error(`[TEST] Game upsert FAILED for ${game.gameId}:`, upsertErr)
        continue
      }
      console.log(`[TEST] Game ${game.gameId} upserted successfully`)

      await db
        .from('teams')
        .update({
          wins: winnerTeam.wins + 1,
          espn_id: winnerEspn.espnId,
        })
        .eq('id', winnerTeam.id)
      console.log(`[TEST] ${winnerTeam.display_name}: wins ${winnerTeam.wins} → ${winnerTeam.wins + 1}`)

      await db
        .from('teams')
        .update({
          is_eliminated: true,
          espn_id: loserEspn.espnId,
        })
        .eq('id', loserTeam.id)
      console.log(`[TEST] ${loserTeam.display_name}: eliminated`)

      winnerTeam.wins += 1
      winnerTeam.espn_id = winnerEspn.espnId
      loserTeam.is_eliminated = true
      loserTeam.espn_id = loserEspn.espnId

      newResults++
      updatedTeams += 2

      const [{ data: winnerPicks }, { data: loserPicks }] = await Promise.all([
        db.from('picks').select('player_name').eq('team_id', winnerTeam.id),
        db.from('picks').select('player_name').eq('team_id', loserTeam.id),
      ])

      const winnerPlayers = winnerPicks?.map((p) => p.player_name) ?? []
      const loserPlayers = loserPicks?.map((p) => p.player_name) ?? []
      console.log(`[TEST] Winner picked by: ${winnerPlayers.join(', ') || 'nobody'}`)
      console.log(`[TEST] Loser picked by: ${loserPlayers.join(', ') || 'nobody'}`)

      const roundName = ROUND_NAMES[round] ?? `Round ${round}`

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
      console.log(`[TEST] Generated message ID: ${messageId}`)

      slackMessages.push({ text, espnGameId: game.gameId, messageId })
    }

    console.log(
      `[TEST] Processing summary — new: ${newResults}, already processed: ${skippedAlreadyProcessed}, ` +
      `not completed: ${skippedNotCompleted}, first four: ${skippedFirstFour}, no match: ${skippedNoMatch}`
    )

    // ── Step 4: Send Slack (identical to prod) ────────────────────────────
    if (slackMessages.length > 0) {
      console.log(`[TEST] Sending ${slackMessages.length} Slack notification(s)...`)

      console.log('[TEST] Fetching standings via RPC...')
      const { data: standingsArr, error: standingsErr } = await db.rpc('get_standings')
      if (standingsErr) {
        console.error('[TEST] get_standings RPC failed:', standingsErr)
      }
      console.log(`[TEST] Standings:`, JSON.stringify(standingsArr))

      const standingsText = standingsArr?.length > 0
        ? '\n\n' + generateStandingsMessage(standingsArr)
        : ''

      for (const msg of slackMessages) {
        console.log(`[TEST] Sending Slack message for game ${msg.espnGameId}...`)
        const slackResult = await sendSlackMessage(msg.text + standingsText)
        console.log(`[TEST] Slack result: ok=${slackResult.ok} status=${slackResult.status}${slackResult.error ? ' error=' + slackResult.error : ''}`)

        await db
          .from('games')
          .update({ slack_notified: true, message_id: msg.messageId })
          .eq('espn_game_id', msg.espnGameId)
        console.log(`[TEST] Marked ${msg.espnGameId} as slack_notified with message_id=${msg.messageId}`)
      }
    } else {
      console.log('[TEST] No new games to notify about')
    }

    const elapsed = Date.now() - startTime
    console.log(`[TEST] === Done in ${elapsed}ms. New results: ${newResults}, Games checked: ${uniqueGames.size} ===`)

    return NextResponse.json({
      success: true,
      newResults,
      updatedTeams,
      gamesChecked: uniqueGames.size,
      skippedAlreadyProcessed,
      elapsed: `${elapsed}ms`,
      next: gameCount < MOCK_ESPN_GAMES.length
        ? `${req.nextUrl.origin}/api/test-scores?game=${gameCount + 1}`
        : 'All tests complete!',
    })
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error(`[TEST] === FAILED after ${elapsed}ms ===`, error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
