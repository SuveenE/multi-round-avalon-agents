#!/usr/bin/env node
/**
 * Prepares game data for static deployment.
 * Loads the 188 games from the dataset folder.
 */

const fs = require("fs");
const path = require("path");

const DATASET_PATH = path.join(__dirname, "..", "..", "dataset");
const OUTPUT_PATH = path.join(__dirname, "..", "public", "data");

// Clean and create output directory
if (fs.existsSync(OUTPUT_PATH)) {
  fs.rmSync(OUTPUT_PATH, { recursive: true });
}
fs.mkdirSync(OUTPUT_PATH, { recursive: true });

const tournaments = [];
let totalGames = 0;

// Dataset A: Cross-Game Learning (50 games)
const datasetA = path.join(DATASET_PATH, "1_cross_game_learning_50g");
if (fs.existsSync(datasetA)) {
  const destDir = path.join(OUTPUT_PATH, "datasets", "A_cross_game_learning");
  fs.mkdirSync(destDir, { recursive: true });

  const srcPath = path.join(datasetA, "all_games.json");
  const data = JSON.parse(fs.readFileSync(srcPath, "utf-8"));

  const gamesIndex = data.games.map((g) => ({
    id: g.game_id,
    winner: g.winner,
    players: g.players?.length || 5,
  }));

  fs.writeFileSync(path.join(destDir, "index.json"), JSON.stringify(gamesIndex, null, 2));
  fs.writeFileSync(path.join(destDir, "all_games.json"), JSON.stringify(data, null, 2));

  tournaments.push({
    name: "A: Cross-Game Learning (50 games)",
    path: "datasets/A_cross_game_learning",
    players: 5,
    games: data.games.length,
    reasoning: "low",
    hasMemory: true,
  });

  totalGames += data.games.length;
  console.log(`Dataset A: ${data.games.length} games`);
}

// Dataset B: Tournaments by Player Count (60 games)
const datasetB = path.join(DATASET_PATH, "2_tournaments_by_player_count");
if (fs.existsSync(datasetB)) {
  const playerCounts = ["5p", "6p", "7p", "8p", "9p", "10p"];

  for (const pc of playerCounts) {
    const pcPath = path.join(datasetB, pc);
    if (!fs.existsSync(pcPath)) continue;

    const destDir = path.join(OUTPUT_PATH, "datasets", `B_tournament_${pc}`);
    fs.mkdirSync(destDir, { recursive: true });

    const srcPath = path.join(pcPath, "all_games.json");
    const data = JSON.parse(fs.readFileSync(srcPath, "utf-8"));

    const gamesIndex = data.games.map((g) => ({
      id: g.game_id,
      winner: g.winner,
      players: g.players?.length || parseInt(pc),
    }));

    fs.writeFileSync(path.join(destDir, "index.json"), JSON.stringify(gamesIndex, null, 2));
    fs.writeFileSync(path.join(destDir, "all_games.json"), JSON.stringify(data, null, 2));

    tournaments.push({
      name: `B: Tournament ${pc} (${data.games.length} games)`,
      path: `datasets/B_tournament_${pc}`,
      players: parseInt(pc),
      games: data.games.length,
      reasoning: "low",
      hasMemory: true,
    });

    totalGames += data.games.length;
    console.log(`Dataset B (${pc}): ${data.games.length} games`);
  }
}

// Dataset C: Individual Games by Player Count (60 games)
const datasetC = path.join(DATASET_PATH, "3_individual_games_by_player_count");
if (fs.existsSync(datasetC)) {
  const playerCounts = ["5p", "6p", "7p", "8p", "9p", "10p"];

  for (const pc of playerCounts) {
    const pcPath = path.join(datasetC, pc);
    if (!fs.existsSync(pcPath)) continue;

    const destDir = path.join(OUTPUT_PATH, "datasets", `C_individual_${pc}`);
    fs.mkdirSync(destDir, { recursive: true });

    // Collect all game JSON files
    const allGames = [];
    const gamesIndex = [];
    const gameFiles = fs.readdirSync(pcPath).filter((f) => f.endsWith(".json"));

    for (const file of gameFiles) {
      const gameData = JSON.parse(fs.readFileSync(path.join(pcPath, file), "utf-8"));
      allGames.push(gameData);
      gamesIndex.push({
        id: gameData.game_id,
        winner: gameData.winner,
        players: gameData.players?.length || parseInt(pc),
      });
    }

    fs.writeFileSync(path.join(destDir, "all_games.json"), JSON.stringify({ games: allGames }, null, 2));
    fs.writeFileSync(path.join(destDir, "index.json"), JSON.stringify(gamesIndex, null, 2));

    tournaments.push({
      name: `C: Individual ${pc} (${allGames.length} games)`,
      path: `datasets/C_individual_${pc}`,
      players: parseInt(pc),
      games: allGames.length,
      reasoning: "low",
      hasMemory: false,
    });

    totalGames += allGames.length;
    console.log(`Dataset C (${pc}): ${allGames.length} games`);
  }
}

// Dataset D: Reasoning Comparison (18 games)
const datasetD = path.join(DATASET_PATH, "4_reasoning_comparison");
if (fs.existsSync(datasetD)) {
  const reasoningLevels = ["low", "medium", "high"];

  for (const level of reasoningLevels) {
    const levelPath = path.join(datasetD, level);
    if (!fs.existsSync(levelPath)) continue;

    const destDir = path.join(OUTPUT_PATH, "datasets", `D_reasoning_${level}`);
    fs.mkdirSync(destDir, { recursive: true });

    // Use all_games.json if it exists
    const allGamesPath = path.join(levelPath, "all_games.json");
    if (fs.existsSync(allGamesPath)) {
      const data = JSON.parse(fs.readFileSync(allGamesPath, "utf-8"));

      const gamesIndex = data.games.map((g) => ({
        id: g.game_id,
        winner: g.winner,
        players: g.players?.length || 5,
      }));

      fs.writeFileSync(path.join(destDir, "index.json"), JSON.stringify(gamesIndex, null, 2));
      fs.writeFileSync(path.join(destDir, "all_games.json"), JSON.stringify(data, null, 2));

      tournaments.push({
        name: `D: Reasoning ${level} (${data.games.length} games)`,
        path: `datasets/D_reasoning_${level}`,
        players: 5,
        games: data.games.length,
        reasoning: level,
        hasMemory: true,
      });

      totalGames += data.games.length;
      console.log(`Dataset D (${level}): ${data.games.length} games`);
    }
  }
}

// Write tournaments index
fs.writeFileSync(
  path.join(OUTPUT_PATH, "tournaments.json"),
  JSON.stringify(tournaments, null, 2)
);

console.log(`\n========================================`);
console.log(`Generated tournaments.json with ${tournaments.length} entries`);
console.log(`Total games: ${totalGames}`);
console.log(`Output directory: ${OUTPUT_PATH}`);
