'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Leaderboard from './components/Leaderboard'
import PlayerCard from './components/PlayerCard'
import GameFeed from './components/GameFeed'
import LiveGames from './components/LiveGames'
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

interface LiveGameTeam {
  name: string
  seed: number
  score: string
  region: string
  players: string[]
}

interface LiveGameData {
  gameId: string
  status: 'in_progress' | 'scheduled'
  statusDetail: string
  clock: string
  period: number
  date: string
  team1: LiveGameTeam
  team2: LiveGameTeam
}

const REFRESH_INTERVAL = 30 // seconds

export default function Home() {
  const [standings, setStandings] = useState<PlayerStanding[]>([])
  const [playerTeams, setPlayerTeams] = useState<
    Record<string, { seed: number; team_name: string; region: string; wins: number; is_eliminated: boolean }[]>
  >({})
  const [games, setGames] = useState<GameData[]>([])
  const [liveGames, setLiveGames] = useState<LiveGameData[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const countdownRef = useRef(REFRESH_INTERVAL)

  const fetchData = useCallback(async () => {
    try {
      const supabase = getSupabase()

      // Fetch DB data and live games in parallel
      const [picksRes, gamesRes, liveRes] = await Promise.all([
        supabase
          .from('picks')
          .select('player_name, seed, team_id, teams(id, name, display_name, seed, region, is_eliminated, wins)')
          .order('seed'),
        supabase
          .from('games')
          .select('id, round, winner_score, loser_score, game_date, winner_team:winner_team_id(display_name, seed), loser_team:loser_team_id(display_name, seed)')
          .eq('status', 'final')
          .order('game_date', { ascending: false })
          .limit(20),
        fetch('/api/live-games').then((r) => r.json()),
      ])

      const picks = picksRes.data
      const recentGames = gamesRes.data

      if (picks) {
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

      if (liveRes?.games) {
        setLiveGames(liveRes.games)
      }

      setLastUpdate(new Date().toLocaleTimeString())
      countdownRef.current = REFRESH_INTERVAL
      setCountdown(REFRESH_INTERVAL)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Data refresh interval
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1)
      setCountdown(countdownRef.current)
    }, 1000)
    return () => clearInterval(tick)
  }, [])

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
  const hasLiveGames = liveGames.some((g) => g.status === 'in_progress')

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Bracket Machine
        </h1>
        <p className="text-gray-400">
          2026 March Madness Pool &middot; 1 point per win
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {hasLiveGames && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              LIVE
            </span>
          )}
          <span className="text-xs text-gray-600">
            Updated {lastUpdate} &middot; refreshing in {countdown}s
          </span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mb-8">
        <Leaderboard standings={standings} />
      </div>

      {/* Live / Upcoming Games */}
      <LiveGames games={liveGames} />

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

      {/* Completed Game Feed */}
      <GameFeed games={games} />
    </main>
  )
}
