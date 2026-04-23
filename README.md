<p align="center">
  <img src="assets/cover.png" width="600" />
</p>

<h1 align="center">Multi-Round Avalon with AI Agents</h1>

<p align="center">
  <a href="https://suveenellawela.com/multi-round-avalon-agents"><img src="https://img.shields.io/badge/Game_Viewer-4285F4?logo=googlechrome&logoColor=white" alt="Game Viewer"></a>
  <a href="https://suveenellawela.com/thoughts/avalon"><img src="https://img.shields.io/badge/Blog_Post-FF5722?logo=hashnode&logoColor=white" alt="Blog Post"></a>
  <a href="https://arxiv.org/pdf/2604.20582"><img src="https://img.shields.io/badge/arXiv-2604.20582-b31b1b.svg" alt="arXiv"></a>
</p>

<p align="center">
  <b>A dataset and analysis of LLM agents playing hidden-role deception games with memory across rounds.</b>
</p>

<p align="center">
  188 games where AI agents play <a href="#how-a-game-works">The Resistance: Avalon</a> — a social deduction game where "good" players complete missions while "evil" players secretly sabotage them. <b>Agents retain memory across games</b>, enabling emergent reputation, trust, and strategic adaptation.
</p>

<p align="center">
  <a href="#key-findings">Key Findings</a> · <a href="#dataset-structure">Dataset</a> · <a href="#quick-start">Quick Start</a> · <a href="#documentation">Docs</a> · <a href="https://suveenellawela.com/multi-round-avalon-agents">Game Viewer</a> · <a href="https://suveenellawela.com/thoughts/avalon">Blog Post</a>
</p>

---

Agents play back-to-back games of Avalon in tournaments, retaining memories of previous games — who played which roles, who lied, and who they can trust. This creates a persistent social environment where reputation and trust evolve over time.

![Tournament System](assets/chart.png)

## Key Findings

Five agents played 50 games in a row, keeping memories between games. What emerged was surprising:

**Reputations formed naturally.** At game 20, agents were saying things like *"Alice tends to play straightforwardly early"* and making decisions based on past behavior. Charlie became known as "subtle" (mentioned 38 times). These reputations were role-conditional — Bob was called "straightforward" 27 times when good, but zero times when evil.

**Trust translated to power.** High-reputation players got picked for teams 45% more often.

**More thinking = better lie detection.** Assassination accuracy (identifying the hidden Merlin): 67% (low reasoning) → 75% (medium) → 100% (high). Deeper reasoning unlocked new strategies like detecting timing tells and self-exclusion patterns.

**The fundamental confusion.** 90% of wrong assassination guesses targeted regular good players who figured things out through logic — because smart deduction looks identical to hidden knowledge.

**Meta-awareness emerged.** At game 35: *"Anchoring off past games can be a trap if either of you rolled evil this time."*

## Overview

| Component | Description |
|-----------|-------------|
| **Dataset** | 188 complete game logs with dialogue, votes, and reasoning |
| **Cross-Game Learning** | 50-game tournament with memory across rounds |
| **Player Count Variations** | 5-10 player configurations (with and without memory) |
| **Reasoning Levels** | Low, medium, and high reasoning effort comparison |
| **Model** | GPT-5.1 with configurable reasoning effort |

## Why Avalon?

Avalon tests AI capabilities that current models struggle with:

| Challenge | Description |
|-----------|-------------|
| Theory of Mind | Modeling what others know and believe |
| Deception | Lying convincingly while detecting others' lies |
| Incomplete Information | Making decisions without full knowledge |
| Persuasion | Convincing others through natural language |

## How a Game Works

Each game consists of up to 5 missions. Good team wins by completing 3 missions; Evil wins by failing 3 or assassinating Merlin.

![Game Flow](assets/gameflow.png)

**Four phases per mission:**
1. **Discussion** - Each player speaks once, sharing observations and suspicions
2. **Team Proposal** - Current leader proposes a team for the mission
3. **Voting** - All players vote to approve/reject the proposal (5th rejection = Evil wins)
4. **Mission Execution** - Approved team members secretly choose success/fail

## Multi-Game Learning

Agents build memories across games in a tournament, learning from past interactions. After each game, players generate self-reflections and observations about other players. This memory persists into subsequent games, enabling emergent social dynamics like reputation tracking and strategic adaptation.

## Dataset Structure

```
dataset/
├── 1_cross_game_learning_50g/        # 50-game tournament (5p, full memory)
│   ├── all_games.json
│   ├── individual_games/
│   └── player_memories.json
│
├── 2_tournaments_by_player_count/    # 10-game tournaments (full memory)
│   ├── 5p/
│   ├── 6p/
│   ├── 7p/
│   ├── 8p/
│   ├── 9p/
│   └── 10p/
│
├── 3_individual_games_by_player_count/  # 10 individual games (no memory)
│   ├── 5p/
│   ├── 6p/
│   ├── 7p/
│   ├── 8p/
│   ├── 9p/
│   └── 10p/
│
└── 4_reasoning_comparison/           # 6 games each (5p, full memory)
    ├── low/
    ├── medium/
    └── high/
```

## Quick Start

### Using the Dataset

```python
import json

# Load 50-game cross-learning tournament
with open("dataset/1_cross_game_learning_50g/all_games.json") as f:
    data = json.load(f)
    games = data['games']
    print(f"Loaded {len(games)} games")

# Load individual game
with open("dataset/3_individual_games_by_player_count/5p/game_00.json") as f:
    game = json.load(f)
```

### Generating New Games

```bash
export OPENAI_API_KEY='your-key'

# Single game
python main.py

# Tournament with learning
python multi_game_runner.py
```

## Documentation

| Document | Contents |
|----------|----------|
| [docs/DATASET.md](docs/DATASET.md) | Full schema, file structure, data fields |
| [docs/GAME_RULES.md](docs/GAME_RULES.md) | Avalon rules, roles, phases, win conditions |
| [docs/TOURNAMENT_SYSTEM.md](docs/TOURNAMENT_SYSTEM.md) | Memory system, cross-game learning |

## Citation

If you use this dataset or code in your research, please cite:

```bibtex
@misc{ellawela2025avalonagents,
  title   = {Multi-Round Avalon with AI Agents},
  author  = {Ellawela, Suveen},
  year    = {2025},
  url     = {https://github.com/SuveenE/multi-round-avalon-agents},
  note    = {A dataset and analysis of LLM agents playing hidden-role deception games with memory across rounds}
}
```
