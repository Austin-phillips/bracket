'use client'

import { ROUND_NAMES } from '@/lib/constants'

interface GameResult {
  id: number
  round: number
  winner_score: number | null
  loser_score: number | null
  game_date: string | null
  winner_team: { display_name: string; seed: number } | null
  loser_team: { display_name: string; seed: number } | null
}

export default function GameFeed({ games }: { games: GameResult[] }) {
  if (games.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Recent Games</h2>
        <p className="text-gray-500">No completed games yet. Check back once games start!</p>
      </div>
    )
  }

  // Sort by most recent first
  const sorted = [...games].sort(
    (a, b) => new Date(b.game_date ?? 0).getTime() - new Date(a.game_date ?? 0).getTime()
  )

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Recent Games</h2>
      <div className="space-y-2">
        {sorted.map((game) => (
          <div
            key={game.id}
            className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-gray-700 px-1.5 py-0.5 rounded">
                  {game.winner_team?.seed}
                </span>
                <span className="font-semibold text-green-400">
                  {game.winner_team?.display_name}
                </span>
                <span className="font-bold">{game.winner_score}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono bg-gray-700 px-1.5 py-0.5 rounded">
                  {game.loser_team?.seed}
                </span>
                <span className="text-gray-400">
                  {game.loser_team?.display_name}
                </span>
                <span className="text-gray-500">{game.loser_score}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">
                {ROUND_NAMES[game.round] ?? `Round ${game.round}`}
              </span>
              {game.game_date && (
                <p className="text-xs text-gray-600">
                  {new Date(game.game_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
