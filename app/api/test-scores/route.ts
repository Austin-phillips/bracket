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
  const startTime = Date.now()
  console.log('[TEST] === Test scores endpoint hit ===')

  try {
    const db = getSupabaseAdmin()

    // Use ?game=N query param to specify which game (1-indexed)
    const gameParam = req.nextUrl.searchParams.get('game')
    const gameNumber = gameParam ? parseInt(gameParam) : null

    if (!gameNumber || gameNumber < 1 || gameNumber > FAKE_MATCHUPS.length) {
      return NextResponse.json({
        error: `Provide ?game=N where N is 1-${FAKE_MATCHUPS.length}`,
        usage: `${req.nextUrl.origin}/api/test-scores?game=1`,
        totalGames: FAKE_MATCHUPS.length,
      }, { status: 400 })
    }

    console.log(`[TEST] Requested game: ${gameNumber}/${FAKE_MATCHUPS.length}`)

    // Fetch teams and message IDs in parallel
    console.log('[TEST] Fetching teams and message IDs...')
    const [
      { data: teams, error: teamsErr },
      { data: allMessageIds },
    ] = await Promise.all([
      db.from('teams').select('*'),
      db.from('games').select('message_id').not('message_id', 'is', null),
    ])
    if (teamsErr) throw teamsErr

    const usedMessageIds = new Set(
      (allMessageIds ?? []).map((g: { message_id: string }) => g.message_id)
    )

    console.log(`[TEST] Teams loaded: ${teams?.length ?? 0}`)
    console.log(`[TEST] Used message IDs: ${usedMessageIds.size}`)

    const testCount = gameNumber - 1
    const matchup = FAKE_MATCHUPS[testCount]
    const fakeGameId = `test-${gameNumber}`

    const winnerTeam = teams!.find(
      (t: Team) => t.seed === matchup.winnerSeed && t.region === matchup.winnerRegion
    )
    const loserTeam = teams!.find(
      (t: Team) => t.seed === matchup.loserSeed && t.region === matchup.loserRegion
    )

    if (!winnerTeam || !loserTeam) {
      console.error(`[TEST] Could not find teams for matchup:`, matchup)
      return NextResponse.json({
        error: 'Could not find teams for matchup',
        matchup,
      }, { status: 500 })
    }

    console.log(`[TEST] Game ${gameNumber}: ${winnerTeam.display_name} (${winnerTeam.seed}) vs ${loserTeam.display_name} (${loserTeam.seed})`)

    // Upsert game record
    console.log(`[TEST] Upserting game record: ${fakeGameId}`)
    const { error: upsertErr } = await db.from('games').upsert(
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
    if (upsertErr) {
      console.error(`[TEST] Game upsert failed:`, upsertErr)
      throw upsertErr
    }
    console.log(`[TEST] Game upserted successfully`)

    // Update team stats
    console.log(`[TEST] Updating team stats: ${winnerTeam.display_name} wins+1, ${loserTeam.display_name} eliminated`)
    await db.from('teams').update({ wins: winnerTeam.wins + 1 }).eq('id', winnerTeam.id)
    await db.from('teams').update({ is_eliminated: true }).eq('id', loserTeam.id)

    // Find which players picked these teams
    const [{ data: winnerPicks }, { data: loserPicks }] = await Promise.all([
      db.from('picks').select('player_name').eq('team_id', winnerTeam.id),
      db.from('picks').select('player_name').eq('team_id', loserTeam.id),
    ])

    const winnerPlayers = winnerPicks?.map((p) => p.player_name) ?? []
    const loserPlayers = loserPicks?.map((p) => p.player_name) ?? []
    console.log(`[TEST] Winner picked by: ${winnerPlayers.join(', ') || 'nobody'}`)
    console.log(`[TEST] Loser picked by: ${loserPlayers.join(', ') || 'nobody'}`)

    const roundName = ROUND_NAMES[matchup.round] ?? `Round ${matchup.round}`

    const { text, messageId } = generateGameMessage(
      {
        winnerTeam: winnerTeam.display_name,
        loserTeam: loserTeam.display_name,
        winnerScore: matchup.winnerScore.toString(),
        loserScore: matchup.loserScore.toString(),
        winnerSeed: winnerTeam.seed,
        loserSeed: loserTeam.seed,
        winnerPlayers,
        loserPlayers,
        round: roundName,
      },
      usedMessageIds
    )
    console.log(`[TEST] Generated message ID: ${messageId}`)

    // Mark as notified + store message ID
    await db
      .from('games')
      .update({ slack_notified: true, message_id: messageId })
      .eq('espn_game_id', fakeGameId)
    console.log(`[TEST] Marked ${fakeGameId} as slack_notified`)

    // Get standings via RPC
    console.log('[TEST] Fetching standings via RPC...')
    const { data: standingsArr, error: standingsErr } = await db.rpc('get_standings')
    if (standingsErr) {
      console.error('[TEST] get_standings RPC failed:', standingsErr)
    }
    console.log(`[TEST] Standings:`, JSON.stringify(standingsArr))

    // Send single combined message to Slack
    let fullMessage = text
    if (standingsArr && standingsArr.length > 0) {
      fullMessage += '\n\n' + generateStandingsMessage(standingsArr)
    }

    console.log('[TEST] Sending combined message to Slack...')
    const slackResult = await sendSlackMessage(fullMessage)
    console.log(`[TEST] Slack result: ok=${slackResult.ok} status=${slackResult.status}${slackResult.error ? ' error=' + slackResult.error : ''}`)

    const elapsed = Date.now() - startTime
    console.log(`[TEST] === Done in ${elapsed}ms. Game ${gameNumber}/${FAKE_MATCHUPS.length} sent ===`)

    return NextResponse.json({
      success: true,
      testGame: gameNumber,
      totalTests: FAKE_MATCHUPS.length,
      matchup: `${winnerTeam.display_name} (${winnerTeam.seed}) ${matchup.winnerScore} - ${loserTeam.display_name} (${loserTeam.seed}) ${matchup.loserScore}`,
      winnerPickedBy: winnerPlayers,
      loserPickedBy: loserPlayers,
      messageId,
      slackResult,
      standings: standingsArr,
      elapsed: `${elapsed}ms`,
      next: gameNumber < FAKE_MATCHUPS.length
        ? `${req.nextUrl.origin}/api/test-scores?game=${gameNumber + 1}`
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
