import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Missing environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// ---------------------------------------------------------------------------
// All 64 tournament teams grouped by region
// ---------------------------------------------------------------------------

interface TeamEntry {
  name: string;
  display_name: string;
  seed: number;
  region: string;
}

const allTeams: TeamEntry[] = [
  // EAST
  { name: "Duke", display_name: "Duke", seed: 1, region: "East" },
  { name: "UConn", display_name: "UConn", seed: 2, region: "East" },
  { name: "Michigan St", display_name: "Michigan St", seed: 3, region: "East" },
  { name: "Kansas", display_name: "Kansas", seed: 4, region: "East" },
  { name: "St John's", display_name: "St John's", seed: 5, region: "East" },
  { name: "Louisville", display_name: "Louisville", seed: 6, region: "East" },
  { name: "UCLA", display_name: "UCLA", seed: 7, region: "East" },
  { name: "Ohio State", display_name: "Ohio State", seed: 8, region: "East" },
  { name: "TCU", display_name: "TCU", seed: 9, region: "East" },
  { name: "UCF", display_name: "UCF", seed: 10, region: "East" },
  { name: "South Florida", display_name: "South Florida", seed: 11, region: "East" },
  { name: "Northern Iowa", display_name: "Northern Iowa", seed: 12, region: "East" },
  { name: "CA Baptist", display_name: "CA Baptist", seed: 13, region: "East" },
  { name: "North Dakota St", display_name: "North Dakota St", seed: 14, region: "East" },
  { name: "Furman", display_name: "Furman", seed: 15, region: "East" },
  { name: "Siena", display_name: "Siena", seed: 16, region: "East" },

  // WEST
  { name: "Arizona", display_name: "Arizona", seed: 1, region: "West" },
  { name: "Purdue", display_name: "Purdue", seed: 2, region: "West" },
  { name: "Gonzaga", display_name: "Gonzaga", seed: 3, region: "West" },
  { name: "Arkansas", display_name: "Arkansas", seed: 4, region: "West" },
  { name: "Wisconsin", display_name: "Wisconsin", seed: 5, region: "West" },
  { name: "BYU", display_name: "BYU", seed: 6, region: "West" },
  { name: "Miami", display_name: "Miami", seed: 7, region: "West" },
  { name: "Villanova", display_name: "Villanova", seed: 8, region: "West" },
  { name: "Utah State", display_name: "Utah State", seed: 9, region: "West" },
  { name: "Missouri", display_name: "Missouri", seed: 10, region: "West" },
  { name: "Texas", display_name: "Texas", seed: 11, region: "West" },
  { name: "High Point", display_name: "High Point", seed: 12, region: "West" },
  { name: "Hawai'i", display_name: "Hawai'i", seed: 13, region: "West" },
  { name: "Kennesaw St", display_name: "Kennesaw St", seed: 14, region: "West" },
  { name: "Queens", display_name: "Queens", seed: 15, region: "West" },
  { name: "Long Island", display_name: "Long Island", seed: 16, region: "West" },

  // SOUTH
  { name: "Florida", display_name: "Florida", seed: 1, region: "South" },
  { name: "Houston", display_name: "Houston", seed: 2, region: "South" },
  { name: "Illinois", display_name: "Illinois", seed: 3, region: "South" },
  { name: "Nebraska", display_name: "Nebraska", seed: 4, region: "South" },
  { name: "Vanderbilt", display_name: "Vanderbilt", seed: 5, region: "South" },
  { name: "North Carolina", display_name: "North Carolina", seed: 6, region: "South" },
  { name: "Saint Mary's", display_name: "Saint Mary's", seed: 7, region: "South" },
  { name: "Clemson", display_name: "Clemson", seed: 8, region: "South" },
  { name: "Iowa", display_name: "Iowa", seed: 9, region: "South" },
  { name: "Texas A&M", display_name: "Texas A&M", seed: 10, region: "South" },
  { name: "VCU", display_name: "VCU", seed: 11, region: "South" },
  { name: "McNeese", display_name: "McNeese", seed: 12, region: "South" },
  { name: "Troy", display_name: "Troy", seed: 13, region: "South" },
  { name: "Penn", display_name: "Penn", seed: 14, region: "South" },
  { name: "Idaho", display_name: "Idaho", seed: 15, region: "South" },
  { name: "Prairie View A&M", display_name: "Prairie View A&M", seed: 16, region: "South" },

  // MIDWEST
  { name: "Michigan", display_name: "Michigan", seed: 1, region: "Midwest" },
  { name: "Iowa State", display_name: "Iowa State", seed: 2, region: "Midwest" },
  { name: "Virginia", display_name: "Virginia", seed: 3, region: "Midwest" },
  { name: "Alabama", display_name: "Alabama", seed: 4, region: "Midwest" },
  { name: "Texas Tech", display_name: "Texas Tech", seed: 5, region: "Midwest" },
  { name: "Tennessee", display_name: "Tennessee", seed: 6, region: "Midwest" },
  { name: "Kentucky", display_name: "Kentucky", seed: 7, region: "Midwest" },
  { name: "Georgia", display_name: "Georgia", seed: 8, region: "Midwest" },
  { name: "Saint Louis", display_name: "Saint Louis", seed: 9, region: "Midwest" },
  { name: "Santa Clara", display_name: "Santa Clara", seed: 10, region: "Midwest" },
  { name: "Miami (OH)", display_name: "Miami (OH)", seed: 11, region: "Midwest" },
  { name: "Akron", display_name: "Akron", seed: 12, region: "Midwest" },
  { name: "Hofstra", display_name: "Hofstra", seed: 13, region: "Midwest" },
  { name: "Wright St", display_name: "Wright St", seed: 14, region: "Midwest" },
  { name: "Tennessee St", display_name: "Tennessee St", seed: 15, region: "Midwest" },
  { name: "Howard", display_name: "Howard", seed: 16, region: "Midwest" },
];

// ---------------------------------------------------------------------------
// Picks: each player chose one team per seed (1-16)
// The value is [teamName, region] so we can look up the correct team row.
// ---------------------------------------------------------------------------

interface PickEntry {
  player_name: string;
  seed: number;
  team_name: string;
  team_region: string;
}

const allPicks: PickEntry[] = [
  // Austin
  { player_name: "Austin", seed: 1, team_name: "Michigan", team_region: "Midwest" },
  { player_name: "Austin", seed: 2, team_name: "UConn", team_region: "East" },
  { player_name: "Austin", seed: 3, team_name: "Gonzaga", team_region: "West" },
  { player_name: "Austin", seed: 4, team_name: "Alabama", team_region: "Midwest" },
  { player_name: "Austin", seed: 5, team_name: "Texas Tech", team_region: "Midwest" },
  { player_name: "Austin", seed: 6, team_name: "Louisville", team_region: "East" },
  { player_name: "Austin", seed: 7, team_name: "Saint Mary's", team_region: "South" },
  { player_name: "Austin", seed: 8, team_name: "Ohio State", team_region: "East" },
  { player_name: "Austin", seed: 9, team_name: "Utah State", team_region: "West" },
  { player_name: "Austin", seed: 10, team_name: "Missouri", team_region: "West" },
  { player_name: "Austin", seed: 11, team_name: "VCU", team_region: "South" },
  { player_name: "Austin", seed: 12, team_name: "McNeese", team_region: "South" },
  { player_name: "Austin", seed: 13, team_name: "Hofstra", team_region: "Midwest" },
  { player_name: "Austin", seed: 14, team_name: "Penn", team_region: "South" },
  { player_name: "Austin", seed: 15, team_name: "Queens", team_region: "West" },
  { player_name: "Austin", seed: 16, team_name: "Siena", team_region: "East" },

  // Shane
  { player_name: "Shane", seed: 1, team_name: "Duke", team_region: "East" },
  { player_name: "Shane", seed: 2, team_name: "Iowa State", team_region: "Midwest" },
  { player_name: "Shane", seed: 3, team_name: "Virginia", team_region: "Midwest" },
  { player_name: "Shane", seed: 4, team_name: "Nebraska", team_region: "South" },
  { player_name: "Shane", seed: 5, team_name: "Wisconsin", team_region: "West" },
  { player_name: "Shane", seed: 6, team_name: "North Carolina", team_region: "South" },
  { player_name: "Shane", seed: 7, team_name: "Miami", team_region: "West" },
  { player_name: "Shane", seed: 8, team_name: "Villanova", team_region: "West" },
  { player_name: "Shane", seed: 9, team_name: "Iowa", team_region: "South" },
  { player_name: "Shane", seed: 10, team_name: "Texas A&M", team_region: "South" },
  { player_name: "Shane", seed: 11, team_name: "South Florida", team_region: "East" },
  { player_name: "Shane", seed: 12, team_name: "Northern Iowa", team_region: "East" },
  { player_name: "Shane", seed: 13, team_name: "Troy", team_region: "South" },
  { player_name: "Shane", seed: 14, team_name: "North Dakota St", team_region: "East" },
  { player_name: "Shane", seed: 15, team_name: "Furman", team_region: "East" },
  { player_name: "Shane", seed: 16, team_name: "Howard", team_region: "Midwest" },

  // Trey
  { player_name: "Trey", seed: 1, team_name: "Florida", team_region: "South" },
  { player_name: "Trey", seed: 2, team_name: "Purdue", team_region: "West" },
  { player_name: "Trey", seed: 3, team_name: "Illinois", team_region: "South" },
  { player_name: "Trey", seed: 4, team_name: "Kansas", team_region: "East" },
  { player_name: "Trey", seed: 5, team_name: "St John's", team_region: "East" },
  { player_name: "Trey", seed: 6, team_name: "BYU", team_region: "West" },
  { player_name: "Trey", seed: 7, team_name: "Kentucky", team_region: "Midwest" },
  { player_name: "Trey", seed: 8, team_name: "Clemson", team_region: "South" },
  { player_name: "Trey", seed: 9, team_name: "TCU", team_region: "East" },
  { player_name: "Trey", seed: 10, team_name: "UCF", team_region: "East" },
  { player_name: "Trey", seed: 11, team_name: "Miami (OH)", team_region: "Midwest" },
  { player_name: "Trey", seed: 12, team_name: "High Point", team_region: "West" },
  { player_name: "Trey", seed: 13, team_name: "CA Baptist", team_region: "East" },
  { player_name: "Trey", seed: 14, team_name: "Wright St", team_region: "Midwest" },
  { player_name: "Trey", seed: 15, team_name: "Idaho", team_region: "South" },
  { player_name: "Trey", seed: 16, team_name: "Long Island", team_region: "West" },

  // Sean
  { player_name: "Sean", seed: 1, team_name: "Arizona", team_region: "West" },
  { player_name: "Sean", seed: 2, team_name: "Houston", team_region: "South" },
  { player_name: "Sean", seed: 3, team_name: "Michigan St", team_region: "East" },
  { player_name: "Sean", seed: 4, team_name: "Arkansas", team_region: "West" },
  { player_name: "Sean", seed: 5, team_name: "Vanderbilt", team_region: "South" },
  { player_name: "Sean", seed: 6, team_name: "Tennessee", team_region: "Midwest" },
  { player_name: "Sean", seed: 7, team_name: "UCLA", team_region: "East" },
  { player_name: "Sean", seed: 8, team_name: "Georgia", team_region: "Midwest" },
  { player_name: "Sean", seed: 9, team_name: "Iowa", team_region: "South" },
  { player_name: "Sean", seed: 10, team_name: "Santa Clara", team_region: "Midwest" },
  { player_name: "Sean", seed: 11, team_name: "Texas", team_region: "West" },
  { player_name: "Sean", seed: 12, team_name: "Akron", team_region: "Midwest" },
  { player_name: "Sean", seed: 13, team_name: "Hawai'i", team_region: "West" },
  { player_name: "Sean", seed: 14, team_name: "Kennesaw St", team_region: "West" },
  { player_name: "Sean", seed: 15, team_name: "Tennessee St", team_region: "Midwest" },
  { player_name: "Sean", seed: 16, team_name: "Prairie View A&M", team_region: "South" },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  console.log("Starting seed...\n");

  // 1. Clear existing data (order matters due to foreign keys)
  console.log("Clearing existing data...");

  const { error: deletePicksErr } = await supabase
    .from("picks")
    .delete()
    .gte("id", 0);
  if (deletePicksErr) {
    console.error("Error deleting picks:", deletePicksErr);
    process.exit(1);
  }
  console.log("  Deleted all picks.");

  const { error: deleteGamesErr } = await supabase
    .from("games")
    .delete()
    .gte("id", 0);
  if (deleteGamesErr) {
    console.error("Error deleting games:", deleteGamesErr);
    process.exit(1);
  }
  console.log("  Deleted all games.");

  const { error: deleteTeamsErr } = await supabase
    .from("teams")
    .delete()
    .gte("id", 0);
  if (deleteTeamsErr) {
    console.error("Error deleting teams:", deleteTeamsErr);
    process.exit(1);
  }
  console.log("  Deleted all teams.\n");

  // 2. Insert all 64 teams
  console.log("Inserting 64 teams...");
  const { data: insertedTeams, error: insertTeamsErr } = await supabase
    .from("teams")
    .insert(allTeams)
    .select();

  if (insertTeamsErr) {
    console.error("Error inserting teams:", insertTeamsErr);
    process.exit(1);
  }
  console.log(`  Inserted ${insertedTeams.length} teams.\n`);

  // 3. Build a lookup map: "name|region" -> team id
  console.log("Building team lookup map...");
  const { data: teams, error: fetchTeamsErr } = await supabase
    .from("teams")
    .select("id, name, region");

  if (fetchTeamsErr || !teams) {
    console.error("Error fetching teams:", fetchTeamsErr);
    process.exit(1);
  }

  const teamLookup = new Map<string, number>();
  for (const team of teams) {
    const key = `${team.name}|${team.region}`;
    teamLookup.set(key, team.id);
  }
  console.log(`  Built lookup with ${teamLookup.size} entries.\n`);

  // 4. Insert all picks with correct team_id references
  console.log("Inserting picks...");

  const picksToInsert = allPicks.map((pick) => {
    const key = `${pick.team_name}|${pick.team_region}`;
    const teamId = teamLookup.get(key);
    if (teamId === undefined) {
      console.error(
        `Could not find team for pick: ${pick.player_name} seed ${pick.seed} - ${pick.team_name} (${pick.team_region})`
      );
      process.exit(1);
    }
    return {
      player_name: pick.player_name,
      seed: pick.seed,
      team_id: teamId,
    };
  });

  const { data: insertedPicks, error: insertPicksErr } = await supabase
    .from("picks")
    .insert(picksToInsert)
    .select();

  if (insertPicksErr) {
    console.error("Error inserting picks:", insertPicksErr);
    process.exit(1);
  }
  console.log(`  Inserted ${insertedPicks.length} picks.\n`);

  // 5. Summary
  console.log("Seed complete!");
  console.log(`  Teams: ${insertedTeams.length}`);
  console.log(`  Picks: ${insertedPicks.length}`);

  const players = [...new Set(allPicks.map((p) => p.player_name))];
  for (const player of players) {
    const count = insertedPicks.filter(
      (p: { player_name: string }) => p.player_name === player
    ).length;
    console.log(`    ${player}: ${count} picks`);
  }
}

seed().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
