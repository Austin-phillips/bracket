'use client'

import { useState } from 'react'

interface PlayerTeam {
  seed: number
  team_name: string
  region: string
  wins: number
  is_eliminated: boolean
}

interface PlayerCardProps {
  name: string
  teams: PlayerTeam[]
  points: number
  color: string
}

const PLAYER_BORDERS: Record<string, string> = {
  Austin: 'border-blue-600',
  Shane: 'border-green-600',
  Trey: 'border-purple-600',
  Sean: 'border-orange-600',
}

const PLAYER_BADGES: Record<string, string> = {
  Austin: 'bg-blue-600',
  Shane: 'bg-green-600',
  Trey: 'bg-purple-600',
  Sean: 'bg-orange-600',
}

export default function PlayerCard({ name, teams, points, color }: PlayerCardProps) {
  const [expanded, setExpanded] = useState(false)
  const alive = teams.filter((t) => !t.is_eliminated).length
  const borderColor = PLAYER_BORDERS[name] ?? 'border-gray-600'
  const badgeColor = PLAYER_BADGES[name] ?? 'bg-gray-600'

  const sortedTeams = [...teams].sort((a, b) => a.seed - b.seed)

  return (
    <div
      className={`bg-gray-900 rounded-xl border-l-4 ${borderColor} shadow-lg overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition"
      >
        <div className="flex items-center gap-3">
          <span className={`${badgeColor} w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold`}>
            {name[0]}
          </span>
          <div className="text-left">
            <h3 className="font-bold text-lg">{name}</h3>
            <p className="text-sm text-gray-400">
              {points} pts &middot; {alive}/{teams.length} alive
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sortedTeams.map((team) => (
              <div
                key={team.seed}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  team.is_eliminated
                    ? 'bg-red-950/30 text-gray-500'
                    : 'bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-gray-700 px-1.5 py-0.5 rounded">
                    {team.seed}
                  </span>
                  <span className={team.is_eliminated ? 'line-through' : 'font-medium'}>
                    {team.team_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{team.region}</span>
                  {team.wins > 0 && (
                    <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded">
                      {team.wins}W
                    </span>
                  )}
                  {team.is_eliminated && (
                    <span className="text-xs text-red-400">OUT</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
