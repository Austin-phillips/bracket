'use client'

const PLAYER_COLORS: Record<string, string> = {
  Austin: 'text-blue-400',
  Shane: 'text-green-400',
  Trey: 'text-purple-400',
  Sean: 'text-orange-400',
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

function PlayerTags({ players }: { players: string[] }) {
  if (players.length === 0) return null
  return (
    <div className="flex gap-1 flex-wrap">
      {players.map((p) => (
        <span
          key={p}
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-700/80 ${PLAYER_COLORS[p] ?? 'text-gray-300'}`}
        >
          {p}
        </span>
      ))}
    </div>
  )
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      Live
    </span>
  )
}

function UpcomingBadge({ date }: { date: string }) {
  const gameDate = new Date(date)
  const timeStr = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return (
    <span className="text-xs text-gray-400 font-medium">
      {timeStr}
    </span>
  )
}

function GameCard({ game }: { game: LiveGameData }) {
  const isLive = game.status === 'in_progress'
  const t1Score = parseInt(game.team1.score) || 0
  const t2Score = parseInt(game.team2.score) || 0
  const t1Winning = t1Score > t2Score
  const t2Winning = t2Score > t1Score

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all ${
        isLive
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 ring-1 ring-red-500/30'
          : 'bg-gray-800/60 ring-1 ring-gray-700/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        {isLive ? <LiveBadge /> : <UpcomingBadge date={game.date} />}
        {isLive && game.statusDetail && (
          <span className="text-xs text-yellow-400/90 font-mono font-semibold">
            {game.statusDetail}
          </span>
        )}
      </div>

      {/* Matchup */}
      <div className="px-4 pb-4 space-y-3">
        {/* Team 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-xs font-mono bg-gray-700 px-1.5 py-0.5 rounded shrink-0">
              {game.team1.seed}
            </span>
            <div className="min-w-0">
              <span className={`font-semibold block truncate ${isLive && t1Winning ? 'text-white' : 'text-gray-300'}`}>
                {game.team1.name}
              </span>
              <PlayerTags players={game.team1.players} />
            </div>
          </div>
          <span className={`text-2xl font-bold tabular-nums ml-3 ${
            isLive && t1Winning ? 'text-white' : 'text-gray-400'
          }`}>
            {isLive ? game.team1.score : '-'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700/50" />

        {/* Team 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-xs font-mono bg-gray-700 px-1.5 py-0.5 rounded shrink-0">
              {game.team2.seed}
            </span>
            <div className="min-w-0">
              <span className={`font-semibold block truncate ${isLive && t2Winning ? 'text-white' : 'text-gray-300'}`}>
                {game.team2.name}
              </span>
              <PlayerTags players={game.team2.players} />
            </div>
          </div>
          <span className={`text-2xl font-bold tabular-nums ml-3 ${
            isLive && t2Winning ? 'text-white' : 'text-gray-400'
          }`}>
            {isLive ? game.team2.score : '-'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function LiveGames({ games }: { games: LiveGameData[] }) {
  if (games.length === 0) return null

  const liveCount = games.filter((g) => g.status === 'in_progress').length
  const upcomingCount = games.filter((g) => g.status === 'scheduled').length

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold">
          {liveCount > 0 ? 'Live Games' : 'Upcoming Games'}
        </h2>
        {liveCount > 0 && (
          <span className="text-sm bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full font-semibold">
            {liveCount} live
          </span>
        )}
        {upcomingCount > 0 && liveCount > 0 && (
          <span className="text-sm bg-gray-700 text-gray-400 px-2.5 py-0.5 rounded-full font-medium">
            {upcomingCount} upcoming
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {games.map((game) => (
          <GameCard key={game.gameId} game={game} />
        ))}
      </div>
    </div>
  )
}
