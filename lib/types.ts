export interface Team {
  id: number
  name: string
  display_name: string
  seed: number
  region: string
  is_eliminated: boolean
  wins: number
  espn_id: string | null
}

export interface Pick {
  id: number
  player_name: string
  seed: number
  team_id: number
  team?: Team // joined
}

export interface Game {
  id: number
  espn_game_id: string
  round: number
  winner_team_id: number | null
  loser_team_id: number | null
  winner_score: number | null
  loser_score: number | null
  status: string
  game_date: string | null
  slack_notified: boolean
  winner_team?: Team // joined
  loser_team?: Team // joined
}

export interface PlayerStanding {
  name: string
  points: number
  teamsAlive: number
  totalTeams: number
}
