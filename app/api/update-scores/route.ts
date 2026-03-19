import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchTournamentGames, normalizeTeamName, ESPNGame } from '@/lib/espn'
import { sendSlackMessage } from '@/lib/slack'
import { TEAM_NAME_ALIASES, ROUND_NAMES } from '@/lib/constants'
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
  if (month === 3 && day <= 19) return 0  // First Four: Mar 18-19
  if (month === 3 && day <= 22) return 1  // Round of 64: Mar 20-21
  if (month === 3 && day <= 24) return 2  // Round of 32: Mar 22-23
  if (month === 3 && day <= 28) return 3  // Sweet 16: Mar 27-28
  if (month === 3 && day <= 30) return 4  // Elite 8: Mar 29-30
  if (month === 4 && day <= 5) return 5   // Final Four: Apr 4
  return 6                                 // Championship: Apr 6
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getSupabaseAdmin()

    // Fetch all teams from DB
    const { data: teams, error: teamsErr } = await db
      .from('teams')
      .select('*')
    if (teamsErr) throw teamsErr

    // Fetch existing games from DB to avoid re-processing
    const { data: existingGames, error: gamesErr } = await db
      .from('games')
      .select('espn_game_id, status')
    if (gamesErr) throw gamesErr

    const processedFinals = new Set(
      existingGames
        ?.filter((g) => g.status === 'final')
        .map((g) => g.espn_game_id) ?? []
    )

    // Fetch games from ESPN without date filter to catch all active tournament games
    const espnGames = await fetchTournamentGames()

    const uniqueGames = new Map<string, ESPNGame>()
    for (const g of espnGames) {
      uniqueGames.set(g.gameId, g)
    }

    let newResults = 0
    let updatedTeams = 0
    const slackMessages: string[] = []

    for (const game of uniqueGames.values()) {
      // Skip games we've already fully processed
      if (processedFinals.has(game.gameId)) continue
      if (!game.completed) continue

      // Find the winner and loser
      const winnerEspn = game.team1.winner ? game.team1 : game.team2
      const loserEspn = game.team1.winner ? game.team2 : game.team1

      const winnerTeam = findMatchingTeam(winnerEspn.displayName, winnerEspn.espnId, teams!)
      const loserTeam = findMatchingTeam(loserEspn.displayName, loserEspn.espnId, teams!)

      if (!winnerTeam || !loserTeam) {
        console.log(
          `Could not match teams: ${winnerEspn.displayName} vs ${loserEspn.displayName}`
        )
        continue
      }

      const round = detectRound(game.date)

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
        console.error('Error upserting game:', upsertErr)
        continue
      }

      // Update winner: increment wins, store ESPN ID
      await db
        .from('teams')
        .update({
          wins: winnerTeam.wins + 1,
          espn_id: winnerEspn.espnId,
        })
        .eq('id', winnerTeam.id)

      // Update loser: mark eliminated, store ESPN ID
      await db
        .from('teams')
        .update({
          is_eliminated: true,
          espn_id: loserEspn.espnId,
        })
        .eq('id', loserTeam.id)

      // Update local state for subsequent iterations
      winnerTeam.wins += 1
      winnerTeam.espn_id = winnerEspn.espnId
      loserTeam.is_eliminated = true
      loserTeam.espn_id = loserEspn.espnId

      newResults++
      updatedTeams += 2

      // Build Slack message
      const roundName = ROUND_NAMES[round] ?? `Round ${round}`
      let msg = `🏀 *${winnerTeam.display_name} ${winnerEspn.score} - ${loserTeam.display_name} ${loserEspn.score}* (${roundName})\n`

      // Find which players are affected
      const { data: winnerPicks } = await db
        .from('picks')
        .select('player_name, seed')
        .eq('team_id', winnerTeam.id)

      const { data: loserPicks } = await db
        .from('picks')
        .select('player_name, seed')
        .eq('team_id', loserTeam.id)

      if (winnerPicks && winnerPicks.length > 0) {
        for (const pick of winnerPicks) {
          msg += `→ ${pick.player_name} gets +1 (${winnerTeam.display_name}, ${winnerTeam.seed}-seed)\n`
        }
      }
      if (loserPicks && loserPicks.length > 0) {
        for (const pick of loserPicks) {
          msg += `❌ ${loserTeam.display_name} eliminated — ${pick.player_name} loses a team\n`
        }
      }

      // Add current standings
      const { data: allPicks } = await db
        .from('picks')
        .select('player_name, team_id, teams(wins, is_eliminated)')

      if (allPicks) {
        const standings = new Map<string, { points: number; alive: number }>()
        for (const p of allPicks as any[]) {
          const current = standings.get(p.player_name) ?? { points: 0, alive: 0 }
          const team = p.teams
          if (team) {
            current.points += team.wins ?? 0
            if (!team.is_eliminated) current.alive++
          }
          standings.set(p.player_name, current)
        }

        const sorted = [...standings.entries()].sort(
          (a, b) => b[1].points - a[1].points
        )
        msg += `\n*Standings:* ${sorted.map(([name, s]) => `${name} ${s.points}`).join(' | ')}`
      }

      slackMessages.push(msg)
    }

    // Send Slack notifications and mark as notified
    for (const msg of slackMessages) {
      await sendSlackMessage(msg)
    }

    if (newResults > 0) {
      await db
        .from('games')
        .update({ slack_notified: true })
        .eq('slack_notified', false)
        .eq('status', 'final')
    }

    return NextResponse.json({
      success: true,
      newResults,
      updatedTeams,
      gamesChecked: uniqueGames.size,
    })
  } catch (error) {
    console.error('Update scores error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
