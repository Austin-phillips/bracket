import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendSlackMessage } from '@/lib/slack'
import { ROUND_NAMES } from '@/lib/constants'
import { generateGameMessage, generateStandingsMessage } from '@/lib/messages'
import { queryStandings } from '@/lib/standings'
import { Team } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Simulated matchups using real bracket seeding:
// Each hit generates the next fake game from this list.
// These update real team wins/eliminations so the dashboard reflects changes.
const FAKE_MATCHUPS = [
  // Game 1: Blowout 1v16 — Austin's Michigan crushes Austin's Siena (self-inflicted)
  { winnerSeed: 1, winnerRegion: 'Midwest', loserSeed: 16, loserRegion: 'East', winnerScore: 88, loserScore: 55, round: 1 },
  // Game 2: Upset 12v5 — Shane's Northern Iowa upsets Austin's Texas Tech
  { winnerSeed: 12, winnerRegion: 'East', loserSeed: 5, loserRegion: 'Midwest', winnerScore: 72, loserScore: 68, round: 1 },
  // Game 3: Close 8v9 — Sean's Georgia edges Trey's TCU
  { winnerSeed: 8, winnerRegion: 'Midwest', loserSeed: 9, loserRegion: 'East', winnerScore: 65, loserScore: 63, round: 1 },
  // Game 4: Blowout 2v15 — Shane's Iowa State crushes Austin's Queens
  { winnerSeed: 2, winnerRegion: 'Midwest', loserSeed: 15, loserRegion: 'West', winnerScore: 95, loserScore: 58, round: 1 },
  // Game 5: Head to head R32 — Austin's Gonzaga beats Sean's Tennessee
  { winnerSeed: 3, winnerRegion: 'West', loserSeed: 6, loserRegion: 'Midwest', winnerScore: 77, loserScore: 74, round: 2 },
  // Game 6: Upset R32 — Austin's VCU over Shane's Virginia
  { winnerSeed: 11, winnerRegion: 'South', loserSeed: 3, loserRegion: 'Midwest', winnerScore: 81, loserScore: 76, round: 2 },
  // Game 7: Nobody picked either — Saint Louis over Villanova
  { winnerSeed: 9, winnerRegion: 'Midwest', loserSeed: 8, loserRegion: 'West', winnerScore: 70, loserScore: 66, round: 1 },
  // Game 8: Only loser picked — Missouri over Sean's UCLA
  { winnerSeed: 10, winnerRegion: 'West', loserSeed: 7, loserRegion: 'East', winnerScore: 69, loserScore: 67, round: 1 },
  // Game 9: Big upset — Trey's CA Baptist over Sean's Arkansas
  { winnerSeed: 13, winnerRegion: 'East', loserSeed: 4, loserRegion: 'West', winnerScore: 82, loserScore: 59, round: 1 },
  // Game 10: Close upset R32 — Austin's Missouri over Trey's Purdue
  { winnerSeed: 10, winnerRegion: 'West', loserSeed: 2, loserRegion: 'West', winnerScore: 71, loserScore: 70, round: 2 },
]

export async function GET(req: NextRequest) {
  try {
    const db = getSupabaseAdmin()

    // Fetch all teams
    const { data: teams, error: teamsErr } = await db.from('teams').select('*')
    if (teamsErr) throw teamsErr

    // Check which test games have already been fully processed (slack_notified = true)
    const testIds = FAKE_MATCHUPS.map((_, i) => `test-${i + 1}`)
    const { data: allTestGames } = await db
      .from('games')
      .select('espn_game_id, message_id, slack_notified')
      .in('espn_game_id', testIds)

    // Count only games that were fully sent to Slack
    const notifiedGames = (allTestGames ?? []).filter((g) => g.slack_notified)
    const testCount = notifiedGames.length

    const usedMessageIds = new Set(
      (allTestGames ?? []).map((g) => g.message_id).filter(Boolean) as string[]
    )

    // Also load message IDs from real games so we don't repeat those either
    const { data: realGames } = await db
      .from('games')
      .select('message_id')
      .not('espn_game_id', 'in', `(${testIds.join(',')})`)
    for (const g of realGames ?? []) {
      if (g.message_id) usedMessageIds.add(g.message_id)
    }

    if (testCount >= FAKE_MATCHUPS.length) {
      return NextResponse.json({
        message: `All ${FAKE_MATCHUPS.length} test games already sent. Clean up test data to re-run.`,
        cleanupSQL: "See reset SQL in the README or ask the dev.",
      })
    }

    // Skip games that exist but weren't notified (partial from a previous run)
    // Delete them so we can re-insert cleanly
    const partialGames = (allTestGames ?? []).filter((g) => !g.slack_notified)
    for (const pg of partialGames) {
      await db.from('games').delete().eq('espn_game_id', pg.espn_game_id)
    }

    // Get the next fake matchup
    const matchup = FAKE_MATCHUPS[testCount]
    const fakeGameId = `test-${testCount + 1}`

    // Find the teams
    const winnerTeam = teams!.find(
      (t: Team) => t.seed === matchup.winnerSeed && t.region === matchup.winnerRegion
    )
    const loserTeam = teams!.find(
      (t: Team) => t.seed === matchup.loserSeed && t.region === matchup.loserRegion
    )

    if (!winnerTeam || !loserTeam) {
      return NextResponse.json({
        error: 'Could not find teams for matchup',
        matchup,
      }, { status: 500 })
    }

    // Insert fake game record
    const { error: insertErr } = await db.from('games').insert({
      espn_game_id: fakeGameId,
      round: matchup.round,
      winner_team_id: winnerTeam.id,
      loser_team_id: loserTeam.id,
      winner_score: matchup.winnerScore,
      loser_score: matchup.loserScore,
      status: 'final',
      game_date: new Date().toISOString(),
      slack_notified: false,
    })
    if (insertErr) throw insertErr

    // UPDATE REAL TEAM DATA — increment wins, mark eliminated
    await db
      .from('teams')
      .update({ wins: winnerTeam.wins + 1 })
      .eq('id', winnerTeam.id)

    await db
      .from('teams')
      .update({ is_eliminated: true })
      .eq('id', loserTeam.id)

    // Find which players picked these teams
    const { data: winnerPicks } = await db
      .from('picks')
      .select('player_name')
      .eq('team_id', winnerTeam.id)

    const { data: loserPicks } = await db
      .from('picks')
      .select('player_name')
      .eq('team_id', loserTeam.id)

    const roundName = ROUND_NAMES[matchup.round] ?? `Round ${matchup.round}`

    // Generate the message
    const { text, messageId } = generateGameMessage(
      {
        winnerTeam: winnerTeam.display_name,
        loserTeam: loserTeam.display_name,
        winnerScore: matchup.winnerScore.toString(),
        loserScore: matchup.loserScore.toString(),
        winnerSeed: winnerTeam.seed,
        loserSeed: loserTeam.seed,
        winnerPlayers: winnerPicks?.map((p) => p.player_name) ?? [],
        loserPlayers: loserPicks?.map((p) => p.player_name) ?? [],
        round: roundName,
      },
      usedMessageIds
    )

    // Send game result to Slack
    await sendSlackMessage(text)

    // Store the message ID
    await db
      .from('games')
      .update({ slack_notified: true, message_id: messageId })
      .eq('espn_game_id', fakeGameId)

    // Brief pause so Slack doesn't rate-limit the second message
    await new Promise((r) => setTimeout(r, 1500))

    // Debug: show all games in DB so we can verify standings source data
    const { data: allGamesDebug } = await db
      .from('games')
      .select('espn_game_id, winner_team_id, loser_team_id, status, slack_notified')

    // Query standings from games table (source of truth)
    const standingsArr = await queryStandings(db)
    let standingsText = ''
    if (standingsArr.length > 0) {
      standingsText = generateStandingsMessage(standingsArr)
      await sendSlackMessage(standingsText)
    }

    return NextResponse.json({
      success: true,
      testGame: testCount + 1,
      totalTests: FAKE_MATCHUPS.length,
      matchup: `${winnerTeam.display_name} (${winnerTeam.seed}) ${matchup.winnerScore} - ${loserTeam.display_name} (${loserTeam.seed}) ${matchup.loserScore}`,
      winnerPickedBy: winnerPicks?.map((p) => p.player_name) ?? [],
      loserPickedBy: loserPicks?.map((p) => p.player_name) ?? [],
      messageId,
      slackMessage: text,
      debug: {
        allGamesInDb: allGamesDebug,
        standingsComputed: standingsArr,
      },
      nextHitWillSend: testCount + 1 < FAKE_MATCHUPS.length
        ? `Game ${testCount + 2}: Seed ${FAKE_MATCHUPS[testCount + 1].winnerSeed} vs Seed ${FAKE_MATCHUPS[testCount + 1].loserSeed}`
        : 'All tests complete!',
    })
  } catch (error) {
    console.error('Test scores error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
