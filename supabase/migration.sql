-- March Madness Bracket Pool - Database Migration
-- Run this in the Supabase SQL editor to create the schema

CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  seed INTEGER NOT NULL,
  region TEXT NOT NULL,
  is_eliminated BOOLEAN DEFAULT FALSE,
  wins INTEGER DEFAULT 0,
  espn_id TEXT
);

CREATE TABLE picks (
  id SERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  seed INTEGER NOT NULL,
  team_id INTEGER REFERENCES teams(id)
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  espn_game_id TEXT UNIQUE,
  round INTEGER DEFAULT 0,
  winner_team_id INTEGER REFERENCES teams(id),
  loser_team_id INTEGER REFERENCES teams(id),
  winner_score INTEGER,
  loser_score INTEGER,
  status TEXT DEFAULT 'scheduled',
  game_date TIMESTAMPTZ,
  slack_notified BOOLEAN DEFAULT FALSE,
  message_id TEXT
);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "public read picks" ON picks FOR SELECT USING (true);
CREATE POLICY "public read games" ON games FOR SELECT USING (true);

-- Service role write access policies
CREATE POLICY "service write teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service write picks" ON picks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service write games" ON games FOR ALL USING (true) WITH CHECK (true);
