# Tournament System

Multi-game tournaments where players learn and adapt across rounds.

## How It Works

| Phase | Description |
|-------|-------------|
| Game N | Players receive memories from games 1 to N-1 |
| Gameplay | Standard Avalon rules with memory-informed decisions |
| Reflection | After each game, players analyze their performance |
| Storage | Reflections saved and used in subsequent games |

## Memory System

### What Players Remember

| Memory Type | Content | Window |
|-------------|---------|--------|
| Self-Assessment | Own performance review | Last 3 games |
| Player Observations | Analysis of each other player | Last 2 per player |

### Memory Injection

Memory context is injected into player prompts:

```
=== YOUR MEMORY FROM PREVIOUS GAMES ===
You have played 5 games before this one.

YOUR PAST PERFORMANCE:
  Game 3 (as good, won):
    I voted too predictably on team proposals
  Game 4 (as evil, lost):
    I should have been more deceptive in discussions
  Game 5 (as merlin, won):
    Successfully stayed hidden while guiding the team

YOUR OBSERVATIONS ABOUT OTHER PLAYERS:
  Bob:
    - [Game 4] He's very analytical in discussions
    - [Game 5] Tends to trust Alice's judgment
  Charlie:
    - [Game 4] Aggressive team proposer
    - [Game 5] Good at reading voting patterns
=== END OF MEMORY ===
```

## Data Structures

### PlayerReflection

```json
{
  "game_number": 1,
  "player_name": "Alice",
  "role_played": "merlin",
  "game_result": "won",
  "self_assessment": "I successfully guided without revealing myself",
  "player_observations": {
    "Bob": "Tends to be cautious in voting",
    "Charlie": "Aggressive in proposing teams"
  },
  "thinking_time": 3.45
}
```

### PlayerMemory

```json
{
  "player_name": "Alice",
  "reflections": [...]
}
```

## Running a Tournament

```bash
export OPENAI_API_KEY='your-key'
python multi_game_runner.py
```

## Output Files

| File | Contents |
|------|----------|
| `all_games.json` | Complete game data for all rounds |
| `player_memories.json` | All player reflections across games |
| `tournament_summary.txt` | Win rates and statistics |
| `individual_games/` | Separate JSON file per game |

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `num_games` | 10 | Games per tournament |
| `memory_window` | 3 | Self-assessments to include |
| `observation_window` | 2 | Observations per player to include |
| `player_names` | Alice-Eve | Configurable player names |

## Memory-Enabled Tournaments in Dataset

| Tournament | Players | Games | Memory Players |
|------------|---------|-------|----------------|
| `5p_50g_low_memory_20251201_015358` | 5 | 50 | Alice |
| `5p_50g_low_memory_20251201_015444` | 5 | 50 | Alice, Bob |
| `10p_10g_low_memory_20251201_015517` | 10 | 10 | Alice |

## Research Applications

- **Learning Dynamics**: How do strategies evolve across games?
- **Observation Accuracy**: Do player observations match reality?
- **Adaptation**: How do players adjust to opponents' patterns?
- **Memory Utilization**: Does memory improve performance?
