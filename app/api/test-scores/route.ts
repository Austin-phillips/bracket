import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendSlackMessage } from '@/lib/slack'
import { ROUND_NAMES } from '@/lib/constants'
import { generateGameMessage, generateStandingsMessage } from '@/lib/messages'
import { Team } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Simulated matchups using real bracket seeding:
const FAKE_MATCHUPS = [
  { winnerSeed: 1, winnerRegion: 'Midwest', loserSeed: 16, loserRegion: 'East', winnerScore: 88, loserScore: 55, round: 1 },
  { winnerSeed: 12, winnerRegion: 'East', loserSeed: 5, loserRegion: 'Midwest', winnerScore: 72, loserScore: 68, round: 1 },
  { winnerSeed: 8, winnerRegion: 'Midwest', loserSeed: 9, loserRegion: 'East', winnerScore: 65, loserScore: 63, round: 1 },
  { winnerSeed: 2, winnerRegion: 'Midwest', loserSeed: 15, loserRegion: 'West', winnerScore: 95, loserScore: 58, round: 1 },
  { winnerSeed: 3, winnerRegion: 'West', loserSeed: 6, loserRegion: 'Midwest', winnerScore: 77, loserScore: 74, round: 2 },
  { winnerSeed: 11, winnerRegion: 'South', loserSeed: 3, loserRegion: 'Midwest', winnerScore: 81, loserScore: 76, round: 2 },
  { winnerSeed: 9, winnerRegion: 'Midwest', loserSeed: 8, loserRegion: 'West', winnerScore: 70, loserScore: 66, round: 1 },
  { winnerSeed: 10, winnerRegion: 'West', loserSeed: 7, loserRegion: 'East', winnerScore: 69, loserScore: 67, round: 1 },
  { winnerSeed: 13, winnerRegion: 'East', loserSeed: 4, loserRegion: 'West', winnerScore: 82, loserScore: 59, round: 1 },
  { winnerSeed: 10, winnerRegion: 'West', loserSeed: 2, loserRegion: 'West', winnerScore: 71, loserScore: 70, round: 2 },
]

export async function GET(req: NextRequest) {
  try {
    const db = getSupabaseAdmin()

    // All reads that touch data we also WRITE use RPC to avoid stale snapshots.
    // Teams + picks are static (never written by this route's logic), so direct reads are safe.

    const [
      { data: teams, error: teamsErr },
      { data: testCountResult },
      { data: allMessageIds },
    ] = await Promise.all([
      db.from('teams').select('*'),
      db.rpc('count_test_games'),
      // Load all used message IDs to avoid repeats (cosmetic, not critical)
      db.from('games').select('message_id').not('message_id', 'is', null),
    ])
    if (teamsErr) throw teamsErr

    const testCount: number = testCountResult ?? 0
    const usedMessageIds = new Set(
      (allMessageIds ?? []).map((g: { message_id: string }) => g.message_id)
    )

    if (testCount >= FAKE_MATCHUPS.length) {
      return NextResponse.json({
        message: `All ${FAKE_MATCHUPS.length} test games already sent. Clean up test data to re-run.`,
      })
    }

    const matchup = FAKE_MATCHUPS[testCount]
    const fakeGameId = `test-${testCount + 1}`

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

    // Upsert game record — safe if stale count causes a re-run of the same game
    await db.from('games').upsert(
      {
        espn_game_id: fakeGameId,
        round: matchup.round,
        winner_team_id: winnerTeam.id,
        loser_team_id: loserTeam.id,
        winner_score: matchup.winnerScore,
        loser_score: matchup.loserScore,
        status: 'final',
        game_date: new Date().toISOString(),
        slack_notified: false,
      },
      { onConflict: 'espn_game_id' }
    )

    // Update team stats (same as prod route does)
    await db
      .from('teams')
      .update({ wins: winnerTeam.wins + 1 })
      .eq('id', winnerTeam.id)

    await db
      .from('teams')
      .update({ is_eliminated: true })
      .eq('id', loserTeam.id)

    // Find which players picked these teams (picks are static, safe to read)
    const [{ data: winnerPicks }, { data: loserPicks }] = await Promise.all([
      db.from('picks').select('player_name').eq('team_id', winnerTeam.id),
      db.from('picks').select('player_name').eq('team_id', loserTeam.id),
    ])

    const roundName = ROUND_NAMES[matchup.round] ?? `Round ${matchup.round}`

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

    // Mark as notified + store message ID
    await db
      .from('games')
      .update({ slack_notified: true, message_id: messageId })
      .eq('espn_game_id', fakeGameId)

    // Get standings via RPC (atomic, always fresh)
    const { data: standingsArr } = await db.rpc('get_standings')

    // Send single combined message to Slack
    let fullMessage = text
    if (standingsArr && standingsArr.length > 0) {
      fullMessage += '\n\n' + generateStandingsMessage(standingsArr)
    }

    const slackResult = await sendSlackMessage(fullMessage)

    return NextResponse.json({
      success: true,
      testGame: testCount + 1,
      totalTests: FAKE_MATCHUPS.length,
      matchup: `${winnerTeam.display_name} (${winnerTeam.seed}) ${matchup.winnerScore} - ${loserTeam.display_name} (${loserTeam.seed}) ${matchup.loserScore}`,
      winnerPickedBy: winnerPicks?.map((p) => p.player_name) ?? [],
      loserPickedBy: loserPicks?.map((p) => p.player_name) ?? [],
      messageId,
      slackResult,
      standings: standingsArr,
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
