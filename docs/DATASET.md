# Dataset Documentation

This document describes the structure and contents of the Avalon gameplay dataset.

## Overview

| Category | Count | Description |
|----------|-------|-------------|
| Tournaments | 16 | Multi-game sessions with consistent player groups |
| Tournament Games | 281 | Individual games within tournaments |
| Individual Game Sets | 3 | Standalone game collections |
| Individual Games | 200 | Games in individual sets |
| **Total Games** | **481** | Complete game logs |

## Directory Structure

```
dataset/
├── tournaments/
│   ├── avalon_tournament_5p_5g_low_20251130_232848/
│   ├── avalon_tournament_5p_6g_high_20251130_183719/
│   ├── avalon_tournament_5p_10g_low_20251130_162851/
│   ├── avalon_tournament_5p_10g_low_20251130_184234/
│   ├── avalon_tournament_5p_10g_low_20251130_233031/
│   ├── avalon_tournament_5p_10g_medium_20251130_183810/
│   ├── avalon_tournament_5p_20g_low_20251130_232915/
│   ├── avalon_tournament_5p_50g_low_20251130_234947/
│   ├── avalon_tournament_5p_50g_low_memory_20251201_015358/
│   ├── avalon_tournament_5p_50g_low_memory_20251201_015444/
│   ├── avalon_tournament_6p_10g_low_20251130_193616/
│   ├── avalon_tournament_7p_10g_low_20251130_193733/
│   ├── avalon_tournament_8p_10g_low_20251130_195419/
│   ├── avalon_tournament_9p_10g_low_20251130_212314/
│   ├── avalon_tournament_10p_10g_low_20251130_212846/
│   └── avalon_tournament_10p_10g_low_memory_20251201_015517/
│
└── individual_games/
    ├── individual_games_5p_20g_low/
    ├── individual_games_5to10p_60g_low/
    └── individual_games_5to10p_120g_low/
```

### Folder Naming Convention

Tournament folders: `avalon_tournament_{players}p_{games}g_{reasoning}[_memory]_{timestamp}`
- `{players}p`: Number of players (5-10)
- `{games}g`: Number of games in tournament
- `{reasoning}`: Reasoning effort level (low/medium/high)
- `_memory`: Present if players have cross-game memory
- `{timestamp}`: Creation timestamp (YYYYMMDD_HHMMSS)

## Tournament Breakdown

### By Player Count

| Players | Tournaments | Games | Roles |
|---------|-------------|-------|-------|
| 5 | 10 | 221 | Merlin, Assassin, Evil, Good, Good |
| 6 | 1 | 10 | +Percival |
| 7 | 1 | 10 | +Morgana |
| 8 | 1 | 10 | +Mordred |
| 9 | 1 | 10 | +Oberon |
| 10 | 2 | 20 | +Good |

### By Reasoning Effort

| Reasoning | Tournaments | Games |
|-----------|-------------|-------|
| Low | 14 | 265 |
| Medium | 1 | 10 |
| High | 1 | 6 |

### Memory-Enabled Tournaments

| Tournament | Players | Games | Memory Players |
|------------|---------|-------|----------------|
| `5p_50g_low_memory_20251201_015358` | 5 | 50 | Alice |
| `5p_50g_low_memory_20251201_015444` | 5 | 50 | Alice, Bob |
| `10p_10g_low_memory_20251201_015517` | 10 | 10 | Alice |

## File Structure

### Tournament Directory Contents

```
avalon_tournament_{...}/
├── all_games.json          # All games in single file
├── individual_games/       # Games as separate files
│   ├── game_01.json
│   ├── game_02.json
│   └── ...
├── player_memories.json    # Player reflections (if memory enabled)
└── tournament_summary.txt  # Statistics summary
```

### Individual Games Directory Contents

```
individual_games_{...}/
└── {player_count}/         # Subfolder by player count
    ├── game_00.json
    ├── game_01.json
    └── ...
```

## Data Schema

### Game Object (Top Level)

```json
{
  "game_id": "avalon_20251201_015358",
  "config": {
    "model": "gpt-5.1",
    "reasoning_effort": "low",
    "mission_team_sizes": [2, 3, 2, 3, 3],
    "num_messages_per_player": 1,
    "num_players": 5
  },
  "players": [...],
  "missions": [...],
  "winner": "good|evil",
  "assassin_phase": {...},
  "post_game_reflections": [...]
}
```

### Player Object

```json
{
  "name": "Alice",
  "role": "merlin|good|evil|assassin|percival|morgana|mordred|oberon",
  "is_good": true,
  "special_knowledge": ["Bob", "Diana"]
}
```

### Mission Object

```json
{
  "mission_number": 1,
  "proposals": [
    {
      "proposal_id": 0,
      "leader": "Bob",
      "team_members": ["Alice", "Bob"],
      "reasoning": "Strategic reasoning for team selection...",
      "thinking_time": 8.267,
      "votes": [
        {
          "player": "Alice",
          "vote": "approve|reject",
          "comment": "Justification for vote...",
          "thinking_time": 9.914
        }
      ],
      "vote_result": "approved|rejected"
    }
  ],
  "final_team_index": 0,
  "discussion": [
    {
      "player": "Alice",
      "content": "Discussion message...",
      "timestamp": 0,
      "global_turn_id": 0,
      "phase": "discussion",
      "thinking_time": 3.455
    }
  ],
  "quest_actions": [
    {
      "player": "Alice",
      "action": "success|fail"
    }
  ],
  "mission_result": "success|fail",
  "fail_count": 0
}
```

### Assassin Phase Object

```json
{
  "assassin": "Eve",
  "evil_discussion": [
    {
      "player": "Bob",
      "content": "Discussion about who is Merlin...",
      "thinking_time": 12.923
    }
  ],
  "guess": "Alice",
  "reasoning": "Reasoning for the guess...",
  "correct": true,
  "thinking_time": 3.015
}
```

### Post-Game Reflection Object

```json
{
  "game_number": 1,
  "player_name": "Alice",
  "role_played": "good",
  "game_result": "lost",
  "self_assessment": "Self-reflection on strategy...",
  "player_observations": {
    "Bob": "Observations about Bob's play...",
    "Charlie": "Observations about Charlie's play..."
  },
  "thinking_time": 9.31
}
```

## Player Names by Game Size

| Players | Names |
|---------|-------|
| 5 | Alice, Bob, Charlie, Diana, Eve |
| 6 | + Frank |
| 7 | + Grace |
| 8 | + Henry |
| 9 | + Iris |
| 10 | + Jack |

## Data Fields for Analysis

### Quantitative Fields
- `thinking_time`: LLM processing time (seconds)
- `fail_count`: Number of fails per mission
- `proposal_id`: Number of rejected proposals before approval
- `global_turn_id`: Conversation sequence number

### Categorical Fields
- `winner`: "good" or "evil"
- `role`: Player's assigned role
- `vote`: "approve" or "reject"
- `action`: "success" or "fail"
- `mission_result`: "success" or "fail"

### Text Fields (NLP Analysis)
- `content`: Discussion messages
- `reasoning`: Strategic explanations
- `comment`: Vote justifications
- `self_assessment`: Post-game reflections
- `player_observations`: Cross-player analysis

## Loading the Data

### Python Example

```python
import json
from pathlib import Path

# Load a single tournament
tournament_path = Path("dataset/tournaments/avalon_tournament_5p_50g_low_20251130_234947")
with open(tournament_path / "all_games.json") as f:
    tournament = json.load(f)

print(f"Games: {tournament['total_games']}")
for game in tournament['games']:
    print(f"  {game['game_id']}: {game['winner']} wins")

# Load all tournaments
tournaments_dir = Path("dataset/tournaments")
all_games = []
for t_dir in tournaments_dir.iterdir():
    if t_dir.is_dir():
        with open(t_dir / "all_games.json") as f:
            data = json.load(f)
            all_games.extend(data['games'])

print(f"Total games loaded: {len(all_games)}")
```

## Suggested Analyses

1. **Win Rate Analysis**: Good vs Evil by player count, reasoning effort
2. **Assassin Effectiveness**: Success rate at identifying Merlin
3. **Deception Detection**: Linguistic markers in evil vs good player dialogue
4. **Learning Effects**: Performance improvement in memory-enabled tournaments
5. **Reasoning Quality**: Correlation between thinking_time and decision quality
6. **Team Composition**: Which team configurations succeed most often
7. **Voting Patterns**: Coalition formation and voting alignment
8. **Role-Specific Behavior**: How different roles communicate differently
