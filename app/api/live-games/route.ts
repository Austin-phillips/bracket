import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchTournamentGames, normalizeTeamName } from '@/lib/espn'
import { TEAM_NAME_ALIASES } from '@/lib/constants'
import { Team } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface LiveGameTeam {
  name: string
  seed: number
  score: string
  region: string
  players: string[] // which pool players own this team
}

export interface LiveGame {
  gameId: string
  status: 'in_progress' | 'scheduled'
  statusDetail: string
  clock: string
  period: number
  date: string
  team1: LiveGameTeam
  team2: LiveGameTeam
}

function findMatchingTeam(
  espnName: string,
  espnId: string,
  teams: Team[]
): Team | null {
  const byId = teams.find((t) => t.espn_id === espnId)
  if (byId) return byId

  const byName = teams.find(
    (t) =>
      t.name.toLowerCase() === espnName.toLowerCase() ||
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

export async function GET() {
  try {
    const db = getSupabaseAdmin()

    const [{ data: teams }, { data: picks }] = await Promise.all([
      db.from('teams').select('*'),
      db.from('picks').select('player_name, team_id'),
    ])

    if (!teams || !picks) {
      return NextResponse.json({ games: [] })
    }

    // Build a map: team_id -> player names
    const teamToPlayers = new Map<number, string[]>()
    for (const pick of picks) {
      const existing = teamToPlayers.get(pick.team_id) ?? []
      existing.push(pick.player_name)
      teamToPlayers.set(pick.team_id, existing)
    }

    const espnGames = await fetchTournamentGames()

    const liveGames: LiveGame[] = []

    for (const game of espnGames) {
      if (game.status !== 'in_progress' && game.status !== 'scheduled') continue
      // Only include games happening today or in progress
      if (game.status === 'scheduled') {
        const gameDate = new Date(game.date)
        const now = new Date()
        const diffHours = (gameDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        // Only show scheduled games within the next 12 hours
        if (diffHours > 12 || diffHours < -1) continue
      }

      const dbTeam1 = findMatchingTeam(game.team1.displayName, game.team1.espnId, teams)
      const dbTeam2 = findMatchingTeam(game.team2.displayName, game.team2.espnId, teams)

      liveGames.push({
        gameId: game.gameId,
        status: game.status as 'in_progress' | 'scheduled',
        statusDetail: game.statusDetail,
        clock: game.clock,
        period: game.period,
        date: game.date,
        team1: {
          name: dbTeam1?.display_name ?? game.team1.displayName,
          seed: dbTeam1?.seed ?? 0,
          score: game.team1.score,
          region: dbTeam1?.region ?? '',
          players: dbTeam1 ? (teamToPlayers.get(dbTeam1.id) ?? []) : [],
        },
        team2: {
          name: dbTeam2?.display_name ?? game.team2.displayName,
          seed: dbTeam2?.seed ?? 0,
          score: game.team2.score,
          region: dbTeam2?.region ?? '',
          players: dbTeam2 ? (teamToPlayers.get(dbTeam2.id) ?? []) : [],
        },
      })
    }

    // Sort: in_progress first, then by date
    liveGames.sort((a, b) => {
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    return NextResponse.json({ games: liveGames })
  } catch (error) {
    console.error('Failed to fetch live games:', error)
    return NextResponse.json({ games: [] })
  }
}
