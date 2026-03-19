const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'

interface ESPNTeamInfo {
  name: string
  displayName: string
  abbreviation: string
  score: string
  winner: boolean
  espnId: string
}

export interface ESPNGame {
  gameId: string
  status: 'scheduled' | 'in_progress' | 'final'
  completed: boolean
  team1: ESPNTeamInfo
  team2: ESPNTeamInfo
  date: string
}

/**
 * Fetches NCAA tournament games from the ESPN scoreboard API.
 *
 * @param date - Optional date in YYYYMMDD format to fetch games for a specific day
 * @returns Array of parsed ESPN game objects
 */
export async function fetchTournamentGames(date?: string): Promise<ESPNGame[]> {
  const params = new URLSearchParams({
    groups: '100',
    limit: '100',
  })

  if (date) {
    params.set('dates', date)
  }

  const url = `${ESPN_SCOREBOARD_URL}?${params.toString()}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`ESPN API responded with status ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const events = data.events ?? []

  return events.map((event: any): ESPNGame => {
    const competition = event.competitions?.[0]
    const competitors = competition?.competitors ?? []
    const statusType = event.status?.type

    // ESPN status mapping
    let status: ESPNGame['status'] = 'scheduled'
    const statusName: string = statusType?.name ?? ''
    if (statusName === 'STATUS_FINAL') {
      status = 'final'
    } else if (statusName === 'STATUS_IN_PROGRESS') {
      status = 'in_progress'
    }

    const completed: boolean = statusType?.completed ?? false

    const parseCompetitor = (comp: any): ESPNTeamInfo => ({
      name: comp.team?.name ?? '',
      displayName: comp.team?.displayName ?? '',
      abbreviation: comp.team?.abbreviation ?? '',
      score: typeof comp.score === 'string' ? comp.score : (comp.score?.displayValue ?? comp.score?.value?.toString() ?? '0'),
      winner: comp.winner ?? false,
      espnId: comp.team?.id?.toString() ?? '',
    })

    // competitors[0] is typically the away team, competitors[1] the home team
    const team1 = competitors.length > 0 ? parseCompetitor(competitors[0]) : emptyTeam()
    const team2 = competitors.length > 1 ? parseCompetitor(competitors[1]) : emptyTeam()

    return {
      gameId: event.id?.toString() ?? '',
      status,
      completed,
      team1,
      team2,
      date: event.date ?? '',
    }
  })
}

function emptyTeam(): ESPNTeamInfo {
  return {
    name: '',
    displayName: '',
    abbreviation: '',
    score: '0',
    winner: false,
    espnId: '',
  }
}

/**
 * Normalizes a team name for fuzzy matching by lowercasing and stripping
 * common suffixes, abbreviations, and punctuation differences.
 */
export function normalizeTeamName(name: string): string {
  let normalized = name.toLowerCase().trim()

  // Remove common mascot/team suffixes that ESPN might include
  const suffixes = [
    'spartans', 'bulldogs', 'wildcats', 'eagles', 'tigers', 'bears',
    'cougars', 'hawks', 'huskies', 'knights', 'lancers', 'panthers',
    'rams', 'red storm', 'red raiders', 'horned frogs', 'cyclones',
    'aggies', 'buckeyes', 'gaels', 'rainbow warriors', 'cowboys',
    'sharks', 'bulls', 'hurricanes', 'redhawks',
  ]

  for (const suffix of suffixes) {
    if (normalized.endsWith(` ${suffix}`)) {
      normalized = normalized.slice(0, -(suffix.length + 1)).trim()
    }
  }

  // Normalize common abbreviation differences
  normalized = normalized
    .replace(/\bst\.\b/g, 'st')
    .replace(/\bstate\b/g, 'st')
    .replace(/\bsaint\b/g, 'st')
    .replace(/\buniversity\b/g, '')
    .replace(/\bof\b/g, '')
    .replace(/[.']/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized
}
