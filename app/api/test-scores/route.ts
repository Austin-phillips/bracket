import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizeTeamName } from '@/lib/espn'
import { sendSlackMessage } from '@/lib/slack'
import { TEAM_NAME_ALIASES, ROUND_NAMES } from '@/lib/constants'
import { generateGameMessage, generateStandingsMessage } from '@/lib/messages'
import { Team } from '@/lib/types'

export const dynamic = 'force-dynamic'

// ── Mock game data using real bracket teams ─────────────────────────────────
const MOCK_GAMES = [
  { winnerName: 'Michigan', loserName: 'Siena', winnerScore: '88', loserScore: '55', date: '2026-03-20T19:00:00Z' },
  { winnerName: 'Northern Iowa', loserName: 'Texas Tech', winnerScore: '72', loserScore: '68', date: '2026-03-20T21:00:00Z' },
  { winnerName: 'Georgia', loserName: 'TCU', winnerScore: '65', loserScore: '63', date: '2026-03-20T23:00:00Z' },
  { winnerName: 'Iowa State', loserName: 'Queens', winnerScore: '95', loserScore: '58', date: '2026-03-21T12:00:00Z' },
  { winnerName: 'Gonzaga', loserName: 'Tennessee', winnerScore: '77', loserScore: '74', date: '2026-03-22T14:00:00Z' },
  { winnerName: 'VCU', loserName: 'Virginia', winnerScore: '81', loserScore: '76', date: '2026-03-22T16:00:00Z' },
  { winnerName: 'Saint Louis', loserName: 'Villanova', winnerScore: '70', loserScore: '66', date: '2026-03-21T14:00:00Z' },
  { winnerName: 'Missouri', loserName: 'UCLA', winnerScore: '69', loserScore: '67', date: '2026-03-21T16:00:00Z' },
  { winnerName: 'CA Baptist', loserName: 'Arkansas', winnerScore: '82', loserScore: '59', date: '2026-03-21T18:00:00Z' },
  { winnerName: 'Missouri', loserName: 'Purdue', winnerScore: '71', loserScore: '70', date: '2026-03-22T18:00:00Z' },
]

// ── Same helpers as prod ────────────────────────────────────────────────────
function findMatchingTeam(espnName: string, teams: Team[]): Team | null {
  const byName = teams.find(
    (t) => t.name.toLowerCase() === espnName.toLowerCase() ||
           t.display_name.toLowerCase() === espnName.toLowerCase()
  )
  if (byName) return byName
  for (const team of teams) {
    const aliases = TEAM_NAME_ALIASES[team.name] ?? []
    if (aliases.some((a) => a.toLowerCase() === espnName.toLowerCase())) return team
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

// ── Main handler ────────────────────────────────────────────────────────────
// ?game=N → replays games 1-N in memory, writes + Slacks ONLY game N
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  console.log('[TEST] === Test scores endpoint hit ===')

  const gameParam = req.nextUrl.searchParams.get('game')
  const gameNumber = gameParam ? parseInt(gameParam) : null

  if (!gameNumber || gameNumber < 1 || gameNumber > MOCK_GAMES.length) {
    return NextResponse.json({
      error: `Provide ?game=N where N is 1-${MOCK_GAMES.length}`,
      usage: `${req.nextUrl.origin}/api/test-scores?game=1`,
      totalGames: MOCK_GAMES.length,
    }, { status: 400 })
  }

  console.log(`[TEST] Game ${gameNumber}/${MOCK_GAMES.length} requested`)

  try {
    const db = getSupabaseAdmin()

    // Read teams and picks upfront
    console.log('[TEST] Fetching teams, picks, and used message IDs...')
    const [
      { data: teams, error: teamsErr },
      { data: allPicks, error: picksErr },
      { data: allMessageIds },
    ] = await Promise.all([
      db.from('teams').select('*'),
      db.from('picks').select('player_name, team_id'),
      db.from('games').select('message_id').not('message_id', 'is', null),
    ])
    if (teamsErr) throw teamsErr
    if (picksErr) throw picksErr

    const usedMessageIds = new Set(
      (allMessageIds ?? []).map((g: { message_id: string }) => g.message_id)
    )
    console.log(`[TEST] Teams: ${teams!.length}, Picks: ${allPicks!.length}, Used IDs: ${usedMessageIds.size}`)

    // ── Reset local teams to baseline, then replay all games 1-N ────────
    // This gives us correct standings regardless of stale DB reads
    for (const team of teams!) {
      team.wins = 0
      team.is_eliminated = false
    }

    const newGameIndex = gameNumber - 1
    let slackText = ''
    let slackMessageId = ''
    let slackGameId = ''
    let matchupSummary = ''

    for (let i = 0; i < gameNumber; i++) {
      const mock = MOCK_GAMES[i]
      const round = detectRound(mock.date)
      const winnerTeam = findMatchingTeam(mock.winnerName, teams!)
      const loserTeam = findMatchingTeam(mock.loserName, teams!)

      if (!winnerTeam || !loserTeam) {
        console.warn(`[TEST] No match for game ${i + 1}: ${mock.winnerName} vs ${mock.loserName}`)
        continue
      }

      // Always mutate local state (for correct standings)
      winnerTeam.wins += 1
      loserTeam.is_eliminated = true

      // Only DB-write and Slack for game N (the new one)
      if (i === newGameIndex) {
        const fakeGameId = `test-${gameNumber}`
        console.log(`[TEST] Processing game ${gameNumber}: ${winnerTeam.display_name} (${winnerTeam.seed}) ${mock.winnerScore} - ${loserTeam.display_name} (${loserTeam.seed}) ${mock.loserScore} | Round ${round}`)

        // Upsert game
        const { error: upsertErr } = await db.from('games').upsert({
          espn_game_id: fakeGameId, round,
          winner_team_id: winnerTeam.id, loser_team_id: loserTeam.id,
          winner_score: parseInt(mock.winnerScore), loser_score: parseInt(mock.loserScore),
          status: 'final', game_date: mock.date, slack_notified: false,
        }, { onConflict: 'espn_game_id' })
        if (upsertErr) {
          console.error(`[TEST] Upsert FAILED:`, upsertErr)
          throw upsertErr
        }
        console.log(`[TEST] Game ${fakeGameId} upserted`)

        // Update teams in DB with absolute values from replay
        await db.from('teams').update({ wins: winnerTeam.wins }).eq('id', winnerTeam.id)
        await db.from('teams').update({ is_eliminated: true }).eq('id', loserTeam.id)
        console.log(`[TEST] ${winnerTeam.display_name}: wins=${winnerTeam.wins} | ${loserTeam.display_name}: eliminated`)

        // Build Slack message
        const winnerPlayers = allPicks!.filter((p) => p.team_id === winnerTeam.id).map((p) => p.player_name)
        const loserPlayers = allPicks!.filter((p) => p.team_id === loserTeam.id).map((p) => p.player_name)
        console.log(`[TEST] Winner picked by: ${winnerPlayers.join(', ') || 'nobody'} | Loser picked by: ${loserPlayers.join(', ') || 'nobody'}`)

        const roundName = ROUND_NAMES[round] ?? `Round ${round}`
        const { text, messageId } = generateGameMessage({
          winnerTeam: winnerTeam.display_name, loserTeam: loserTeam.display_name,
          winnerScore: mock.winnerScore, loserScore: mock.loserScore,
          winnerSeed: winnerTeam.seed, loserSeed: loserTeam.seed,
          winnerPlayers, loserPlayers, round: roundName,
        }, usedMessageIds)

        slackText = text
        slackMessageId = messageId
        slackGameId = fakeGameId
        matchupSummary = `${winnerTeam.display_name} (${winnerTeam.seed}) ${mock.winnerScore} - ${loserTeam.display_name} (${loserTeam.seed}) ${mock.loserScore}`
      } else {
        console.log(`[TEST] Replaying game ${i + 1} in memory: ${winnerTeam.display_name} beat ${loserTeam.display_name}`)
      }
    }

    // ── Compute standings from fully-replayed local state ────────────────
    const standingsArr: { name: string; points: number; alive: number }[] = []
    const standingsMap = new Map<string, { points: number; alive: number }>()
    for (const pick of allPicks!) {
      const team = teams!.find((t) => t.id === pick.team_id)
      if (!team) continue
      const cur = standingsMap.get(pick.player_name) ?? { points: 0, alive: 0 }
      cur.points += team.wins
      if (!team.is_eliminated) cur.alive++
      standingsMap.set(pick.player_name, cur)
    }
    for (const [name, s] of standingsMap) {
      standingsArr.push({ name, points: s.points, alive: s.alive })
    }
    standingsArr.sort((a, b) => b.points - a.points || b.alive - a.alive)
    console.log(`[TEST] Standings:`, JSON.stringify(standingsArr))

    // ── Send ONE Slack message ──────────────────────────────────────────
    if (slackText) {
      const standingsText = standingsArr.length > 0
        ? '\n\n' + generateStandingsMessage(standingsArr)
        : ''

      console.log(`[TEST] Sending Slack for game ${gameNumber}...`)
      const slackResult = await sendSlackMessage(slackText + standingsText)
      console.log(`[TEST] Slack: ok=${slackResult.ok} status=${slackResult.status}${slackResult.error ? ' error=' + slackResult.error : ''}`)

      await db.from('games')
        .update({ slack_notified: true, message_id: slackMessageId })
        .eq('espn_game_id', slackGameId)
    }

    const elapsed = Date.now() - startTime
    console.log(`[TEST] === Done in ${elapsed}ms ===`)

    return NextResponse.json({
      success: true,
      game: gameNumber,
      matchup: matchupSummary,
      standings: standingsArr,
      elapsed: `${elapsed}ms`,
      next: gameNumber < MOCK_GAMES.length
        ? `${req.nextUrl.origin}/api/test-scores?game=${gameNumber + 1}`
        : 'All tests complete!',
    })
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error(`[TEST] === FAILED after ${elapsed}ms ===`, error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
