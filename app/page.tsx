'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Leaderboard from './components/Leaderboard'
import PlayerCard from './components/PlayerCard'
import GameFeed from './components/GameFeed'
import { PlayerStanding } from '@/lib/types'

let _supabase: SupabaseClient | null = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

interface TeamData {
  id: number
  name: string
  display_name: string
  seed: number
  region: string
  is_eliminated: boolean
  wins: number
}

interface PickData {
  player_name: string
  seed: number
  team_id: number
  teams: TeamData
}

interface GameData {
  id: number
  round: number
  winner_score: number | null
  loser_score: number | null
  game_date: string | null
  winner_team: { display_name: string; seed: number } | null
  loser_team: { display_name: string; seed: number } | null
}

export default function Home() {
  const [standings, setStandings] = useState<PlayerStanding[]>([])
  const [playerTeams, setPlayerTeams] = useState<
    Record<string, { seed: number; team_name: string; region: string; wins: number; is_eliminated: boolean }[]>
  >({})
  const [games, setGames] = useState<GameData[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      // Fetch picks with joined team data
      const supabase = getSupabase()
      const { data: picks } = await supabase
        .from('picks')
        .select('player_name, seed, team_id, teams(id, name, display_name, seed, region, is_eliminated, wins)')
        .order('seed')

      // Fetch recent completed games
      const { data: recentGames } = await supabase
        .from('games')
        .select('id, round, winner_score, loser_score, game_date, winner_team:winner_team_id(display_name, seed), loser_team:loser_team_id(display_name, seed)')
        .eq('status', 'final')
        .order('game_date', { ascending: false })
        .limit(20)

      if (picks) {
        // Calculate standings
        const standingsMap = new Map<string, { points: number; alive: number; total: number }>()
        const teamsMap: Record<string, { seed: number; team_name: string; region: string; wins: number; is_eliminated: boolean }[]> = {}

        for (const pick of picks as unknown as PickData[]) {
          const team = pick.teams
          if (!team) continue

          const current = standingsMap.get(pick.player_name) ?? { points: 0, alive: 0, total: 0 }
          current.points += team.wins
          current.total++
          if (!team.is_eliminated) current.alive++
          standingsMap.set(pick.player_name, current)

          if (!teamsMap[pick.player_name]) teamsMap[pick.player_name] = []
          teamsMap[pick.player_name].push({
            seed: team.seed,
            team_name: team.display_name,
            region: team.region,
            wins: team.wins,
            is_eliminated: team.is_eliminated,
          })
        }

        setStandings(
          [...standingsMap.entries()].map(([name, s]) => ({
            name,
            points: s.points,
            teamsAlive: s.alive,
            totalTeams: s.total,
          }))
        )
        setPlayerTeams(teamsMap)
      }

      if (recentGames) {
        setGames(recentGames as unknown as GameData[])
      }

      setLastUpdate(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every 60s
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading bracket data...</p>
        </div>
      </div>
    )
  }

  const playerOrder = ['Austin', 'Shane', 'Trey', 'Sean']

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          🏀 Bracket Machine
        </h1>
        <p className="text-gray-400">
          2026 March Madness Pool &middot; 1 point per win
        </p>
        {lastUpdate && (
          <p className="text-xs text-gray-600 mt-1">
            Last updated: {lastUpdate} &middot; Auto-refreshes every 60s
          </p>
        )}
      </div>

      {/* Leaderboard */}
      <div className="mb-8">
        <Leaderboard standings={standings} />
      </div>

      {/* Player Cards */}
      <div className="mb-8 space-y-4">
        <h2 className="text-2xl font-bold">Teams</h2>
        {playerOrder.map((name) => (
          <PlayerCard
            key={name}
            name={name}
            teams={playerTeams[name] ?? []}
            points={standings.find((s) => s.name === name)?.points ?? 0}
            color=""
          />
        ))}
      </div>

      {/* Game Feed */}
      <GameFeed games={games} />
    </main>
  )
}
