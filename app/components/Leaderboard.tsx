'use client'

import { PlayerStanding } from '@/lib/types'

const PLAYER_COLORS: Record<string, string> = {
  Austin: 'bg-blue-600',
  Shane: 'bg-green-600',
  Trey: 'bg-purple-600',
  Sean: 'bg-orange-600',
}

export default function Leaderboard({ standings }: { standings: PlayerStanding[] }) {
  const sorted = [...standings].sort((a, b) => b.points - a.points)
  const maxPoints = Math.max(...sorted.map((s) => s.points), 1)

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
      <div className="space-y-3">
        {sorted.map((player, i) => (
          <div key={player.name} className="flex items-center gap-4">
            <span className="text-2xl font-bold text-gray-500 w-8">
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-semibold text-lg">{player.name}</span>
                <span className="text-sm text-gray-400">
                  {player.teamsAlive}/{player.totalTeams} alive
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden relative">
                <div
                  className={`h-full rounded-full ${player.points === 0 ? 'bg-gray-700' : (PLAYER_COLORS[player.name] ?? 'bg-gray-600')} transition-all duration-500`}
                  style={{ width: `${Math.max((player.points / maxPoints) * 100, 8)}%` }}
                />
                <span className="absolute inset-0 flex items-center px-3 text-sm font-bold">
                  {player.points} pts
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
