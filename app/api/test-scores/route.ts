import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendSlackMessage } from '@/lib/slack'
import { ROUND_NAMES } from '@/lib/constants'
import { generateGameMessage, generateStandingsMessage } from '@/lib/messages'
import { Team } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Simulated matchups using real bracket seeding:
// Each hit generates the next fake game from this list
const FAKE_MATCHUPS = [
  // Normal game: 1-seed vs 16-seed (blowout) — Austin vs nobody
  { winnerSeed: 1, winnerRegion: 'Midwest', loserSeed: 16, loserRegion: 'East', winnerScore: 88, loserScore: 55, round: 1 },
  // Upset: 12-seed vs 5-seed — Shane vs Austin
  { winnerSeed: 12, winnerRegion: 'East', loserSeed: 5, loserRegion: 'Midwest', winnerScore: 72, loserScore: 68, round: 1 },
  // Close game: 8 vs 9 — Sean vs Trey
  { winnerSeed: 8, winnerRegion: 'Midwest', loserSeed: 9, loserRegion: 'East', winnerScore: 65, loserScore: 63, round: 1 },
  // Blowout: 2-seed vs 15-seed — Shane vs Austin
  { winnerSeed: 2, winnerRegion: 'Midwest', loserSeed: 15, loserRegion: 'West', winnerScore: 95, loserScore: 58, round: 1 },
  // Head to head: 3 vs 6 — Austin vs Sean
  { winnerSeed: 3, winnerRegion: 'West', loserSeed: 6, loserRegion: 'Midwest', winnerScore: 77, loserScore: 74, round: 2 },
  // Upset: 11-seed vs 3-seed — Austin vs Shane
  { winnerSeed: 11, winnerRegion: 'South', loserSeed: 3, loserRegion: 'Midwest', winnerScore: 81, loserScore: 76, round: 2 },
  // Nobody picked either: random matchup
  { winnerSeed: 9, winnerRegion: 'Midwest', loserSeed: 8, loserRegion: 'West', winnerScore: 70, loserScore: 66, round: 1 },
  // Only loser picked: Sean loses a team
  { winnerSeed: 10, winnerRegion: 'West', loserSeed: 7, loserRegion: 'East', winnerScore: 69, loserScore: 67, round: 1 },
  // Blowout upset: 13 over 4 — Trey picks winner
  { winnerSeed: 13, winnerRegion: 'East', loserSeed: 4, loserRegion: 'West', winnerScore: 82, loserScore: 59, round: 1 },
  // Close upset: 10 over 2 — Austin vs Trey
  { winnerSeed: 10, winnerRegion: 'West', loserSeed: 2, loserRegion: 'West', winnerScore: 71, loserScore: 70, round: 2 },
]

export async function GET(req: NextRequest) {
  try {
    const db = getSupabaseAdmin()

    // Fetch all teams
    const { data: teams, error: teamsErr } = await db.from('teams').select('*')
    if (teamsErr) throw teamsErr

    // Check how many test games we've already sent
    const { data: existingTestGames } = await db
      .from('games')
      .select('espn_game_id, message_id')
      .like('espn_game_id', 'test-%')

    const testCount = existingTestGames?.length ?? 0
    const usedMessageIds = new Set(
      existingTestGames?.map((g) => g.message_id).filter(Boolean) as string[] ?? []
    )

    // Also load message IDs from real games so we don't repeat those either
    const { data: realGames } = await db
      .from('games')
      .select('message_id')
      .not('espn_game_id', 'like', 'test-%')
    for (const g of realGames ?? []) {
      if (g.message_id) usedMessageIds.add(g.message_id)
    }

    if (testCount >= FAKE_MATCHUPS.length) {
      return NextResponse.json({
        message: `All ${FAKE_MATCHUPS.length} test games already sent. Clean up test data to re-run.`,
        cleanupSQL: "DELETE FROM games WHERE espn_game_id LIKE 'test-%';",
      })
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

    // Insert fake game (don't update real team wins/elimination — this is just a message test)
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

    // Send to Slack
    await sendSlackMessage(text)

    // Store the message ID
    await db
      .from('games')
      .update({ slack_notified: true, message_id: messageId })
      .eq('espn_game_id', fakeGameId)

    // Send standings (use real team data + simulated context)
    const { data: allPicks } = await db
      .from('picks')
      .select('player_name, team_id, teams(wins, is_eliminated)')

    let standingsText = ''
    if (allPicks) {
      const standings = new Map<string, { points: number; alive: number }>()
      for (const p of allPicks as any[]) {
        const current = standings.get(p.player_name) ?? { points: 0, alive: 0 }
        const team = p.teams
        if (team) {
          // Add fake wins for this test game
          let extraWins = 0
          let eliminated = team.is_eliminated
          if (team.id === winnerTeam.id) extraWins = 1
          if (team.id === loserTeam.id) eliminated = true
          current.points += (team.wins ?? 0) + extraWins
          if (!eliminated) current.alive++
        }
        standings.set(p.player_name, current)
      }

      const standingsArr = [...standings.entries()].map(([name, s]) => ({
        name,
        points: s.points,
        alive: s.alive,
      }))

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
