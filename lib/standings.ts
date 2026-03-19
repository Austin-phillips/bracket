import { SupabaseClient } from '@supabase/supabase-js'

export interface StandingsResult {
  standings: { name: string; points: number; alive: number }[]
  debug?: {
    games: unknown[]
    picksForWinners: { player_name: string; team_id: number }[]
    teamWinIds: number[]
    teamEliminatedIds: number[]
  }
}

/**
 * Computes current standings by counting wins from the games table.
 * This is the source of truth — avoids stale reads from teams.wins.
 */
export async function queryStandings(
  db: SupabaseClient,
  includeDebug = false
): Promise<StandingsResult> {
  const [
    { data: allGames },
    { data: allPicks },
    { data: allTeams },
  ] = await Promise.all([
    db.from('games').select('winner_team_id, loser_team_id').eq('status', 'final'),
    db.from('picks').select('player_name, team_id'),
    db.from('teams').select('id'),
  ])

  if (!allPicks) return { standings: [] }

  // Count wins and eliminations from completed games
  const teamWins = new Map<number, number>()
  const teamEliminated = new Set<number>()
  for (const g of (allGames ?? [])) {
    teamWins.set(g.winner_team_id, (teamWins.get(g.winner_team_id) ?? 0) + 1)
    teamEliminated.add(g.loser_team_id)
  }

  // Build per-player standings
  const allTeamIds = new Set((allTeams ?? []).map((t) => t.id))
  const standings = new Map<string, { points: number; alive: number }>()

  for (const p of allPicks) {
    const current = standings.get(p.player_name) ?? { points: 0, alive: 0 }
    current.points += teamWins.get(p.team_id) ?? 0
    if (allTeamIds.has(p.team_id) && !teamEliminated.has(p.team_id)) current.alive++
    standings.set(p.player_name, current)
  }

  const standingsArr = [...standings.entries()].map(([name, s]) => ({
    name,
    points: s.points,
    alive: s.alive,
  }))

  const winnerTeamIds = [...teamWins.keys()]
  const result: StandingsResult = { standings: standingsArr }

  if (includeDebug) {
    result.debug = {
      games: allGames ?? [],
      picksForWinners: allPicks.filter((p) => winnerTeamIds.includes(p.team_id)),
      teamWinIds: winnerTeamIds,
      teamEliminatedIds: [...teamEliminated],
    }
  }

  return result
}
