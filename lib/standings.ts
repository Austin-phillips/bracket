import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Computes current standings by counting wins from the games table.
 * This is the source of truth — avoids stale reads from teams.wins.
 */
export async function queryStandings(
  db: SupabaseClient
): Promise<{ name: string; points: number; alive: number }[]> {
  const [
    { data: allGames },
    { data: allPicks },
    { data: allTeams },
  ] = await Promise.all([
    db.from('games').select('winner_team_id, loser_team_id').eq('status', 'final'),
    db.from('picks').select('player_name, team_id'),
    db.from('teams').select('id'),
  ])

  if (!allPicks) return []

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

  return [...standings.entries()].map(([name, s]) => ({
    name,
    points: s.points,
    alive: s.alive,
  }))
}
