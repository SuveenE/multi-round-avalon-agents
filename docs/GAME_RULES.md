# Game Rules

The Resistance: Avalon is a social deduction game where players with hidden roles complete missions while some players secretly sabotage them.

## Roles

### 5-Player Game (Base)

| Role | Team | Knowledge | Objective |
|------|------|-----------|-----------|
| Merlin | Good | Knows all evil players | Guide good team without being identified |
| Good (x2) | Good | None | Deduce who is evil |
| Assassin | Evil | Knows other evil | Sabotage missions; identify Merlin if good wins |
| Evil | Evil | Knows other evil | Sabotage missions |

### Extended Roles (6-10 Players)

| Players | Roles |
|---------|-------|
| 6 | Merlin, Percival, Good, Good, Morgana, Mordred |
| 7 | Merlin, Percival, Good, Good, Morgana, Mordred, Oberon |
| 8 | Merlin, Percival, Good (x3), Morgana, Mordred, Assassin |
| 9 | Merlin, Percival, Good (x4), Morgana, Mordred, Assassin |
| 10 | Merlin, Percival, Good (x4), Morgana, Mordred, Oberon, Assassin |

### Special Role Abilities

| Role | Ability |
|------|---------|
| Percival | Sees Merlin (and Morgana, if present) |
| Morgana | Appears as Merlin to Percival |
| Mordred | Hidden from Merlin's knowledge |
| Oberon | Evil but unknown to other evil players |

## Gameplay Flow

### Per Mission Structure

```
┌─────────────────────────────────────────────────────────────┐
│ MISSION START                                               │
├─────────────────────────────────────────────────────────────┤
│ 1. DISCUSSION PHASE                                         │
│    • Each player speaks once (1 message per player)         │
│    • Players discuss trust, suspicions, strategy            │
│    • Happens once at the start of each mission              │
├─────────────────────────────────────────────────────────────┤
│ 2. TEAM PROPOSAL (up to 5 attempts)                         │
│    • Current leader proposes a team                         │
│    • Leader provides reasoning for selection                │
│    • Leadership rotates on rejection                        │
├─────────────────────────────────────────────────────────────┤
│ 3. VOTING PHASE                                             │
│    • Each player votes independently (approve/reject)       │
│    • Players provide justification with their vote          │
│    • Votes are secret until all players have voted          │
│    • All votes and justifications revealed simultaneously   │
│    • Majority required to approve                           │
│    • 5th proposal auto-approves (no voting)                 │
├─────────────────────────────────────────────────────────────┤
│ 4. MISSION EXECUTION                                        │
│    • Approved team members secretly choose success/fail     │
│    • Good players MUST vote success                         │
│    • Evil players choose strategically                      │
│    • Any fail card = mission fails                          │
├─────────────────────────────────────────────────────────────┤
│ MISSION END → Next mission or game end                      │
└─────────────────────────────────────────────────────────────┘
```

### Mission Team Sizes

| Mission | 5p | 6p | 7p | 8p | 9p | 10p |
|---------|----|----|----|----|----|----|
| 1 | 2 | 2 | 2 | 3 | 3 | 3 |
| 2 | 3 | 3 | 3 | 4 | 4 | 4 |
| 3 | 2 | 4 | 3 | 4 | 4 | 4 |
| 4 | 3 | 3 | 4* | 5* | 5* | 5* |
| 5 | 3 | 4 | 4 | 5 | 5 | 5 |

*Mission 4 requires 2 fail cards to fail (7+ players only)

### Turn Count Per Game

| Phase | Turns per Mission | Total (5 missions) |
|-------|-------------------|-------------------|
| Discussion | 5-10 messages (1 per player) | 25-50 messages |
| Proposals | 1-5 proposals | 5-25 proposals |
| Voting | 5-10 votes × 1-4 proposals | 25-200 votes |
| Execution | Team size actions | ~13 actions (5p) |

**Typical 5-player game**: ~80-150 total decision points

### Assassin Phase

Triggered when good wins 3 missions:

```
┌─────────────────────────────────────────────────────────────┐
│ ASSASSIN PHASE                                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Evil team reveals identities to each other               │
│ 2. Evil players discuss who they think is Merlin            │
│    • Each evil player speaks once                           │
│    • Analysis based on all game discussions                 │
│ 3. Assassin makes final guess                               │
│    • Provides reasoning for the choice                      │
├─────────────────────────────────────────────────────────────┤
│ OUTCOME                                                     │
│ • Correct guess → Evil wins                                 │
│ • Wrong guess → Good wins                                   │
└─────────────────────────────────────────────────────────────┘
```

## Win Conditions

| Winner | Condition |
|--------|-----------|
| Good | 3 missions succeed AND Assassin fails to identify Merlin |
| Evil | 3 missions fail OR Assassin correctly identifies Merlin |

## Generator Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Model | gpt-5.1 | OpenAI model used |
| Reasoning Effort | low / medium / high | Configurable per game |
| Messages per Player | 1 | Discussion messages per mission |
| Max Proposals | 5 | Per mission (5th auto-approves) |

### Running a Game

```bash
export OPENAI_API_KEY='your-key'
python main.py
python main.py --num-players 7  # For 7-player game
```

## Agent Behaviors

| Role | Strategy |
|------|----------|
| Good | Logical deduction, truthful communication |
| Evil | Create confusion, appear trustworthy, strategic failing |
| Merlin | Subtle guidance without revealing knowledge |
| Assassin | Analyze behavior patterns to identify Merlin |
