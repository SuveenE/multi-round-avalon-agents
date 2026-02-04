import os
import json
from datetime import datetime
from typing import List, Dict
from dataclasses import dataclass, asdict
from main import AvalonGame, Player, GameState

@dataclass
class PlayerReflection:
    game_number: int
    player_name: str
    role_played: str
    game_result: str
    self_assessment: str
    player_observations: Dict[str, str]
    thinking_time: float

@dataclass
class PlayerMemory:
    player_name: str
    reflections: List[PlayerReflection]
    
    def get_context_string(self) -> str:
        if not self.reflections:
            return ""
        
        context = "\n=== YOUR MEMORY FROM PREVIOUS GAMES ===\n"
        context += f"You have played {len(self.reflections)} games before this one.\n\n"
        
        context += "YOUR PAST PERFORMANCE:\n"
        for reflection in self.reflections[-3:]:
            context += f"  Game {reflection.game_number} (as {reflection.role_played}, {reflection.game_result}):\n"
            context += f"    {reflection.self_assessment}\n"
        
        context += "\nYOUR OBSERVATIONS ABOUT OTHER PLAYERS:\n"
        player_notes = {}
        for reflection in self.reflections:
            for player, observation in reflection.player_observations.items():
                if player not in player_notes:
                    player_notes[player] = []
                player_notes[player].append(f"[Game {reflection.game_number}] {observation}")
        
        for player, notes in player_notes.items():
            context += f"  {player}:\n"
            for note in notes[-2:]:
                context += f"    - {note}\n"
        
        context += "=== END OF MEMORY ===\n\n"
        return context


class LearningAvalonGame(AvalonGame):
    def __init__(self, player_memories: Dict[str, PlayerMemory], num_players: int = 5, model: str = None, reasoning_effort: str = None):
        if model is None:
            from main import MODEL as DEFAULT_MODEL
            model = DEFAULT_MODEL
        if reasoning_effort is None:
            from main import REASONING_EFFORT as DEFAULT_REASONING_EFFORT
            reasoning_effort = DEFAULT_REASONING_EFFORT
        
        super().__init__(num_players=num_players, model=model, reasoning_effort=reasoning_effort)
        self.player_memories = player_memories
    
    def get_player_context(self, player: Player, mission_num: int) -> str:
        context = super().get_player_context(player, mission_num)
        
        if player.name in self.player_memories:
            memory_context = self.player_memories[player.name].get_context_string()
            parts = context.split("\nALL PLAYERS:")
            if len(parts) == 2:
                context = parts[0] + memory_context + "\nALL PLAYERS:" + parts[1]
        
        return context


class MultiGameRunner:
    def __init__(self, num_games: int = 10, num_players: int = 5, model: str = None, reasoning_effort: str = None, memory_enabled_players: List[str] = None):
        if model is None:
            from main import MODEL as DEFAULT_MODEL
            model = DEFAULT_MODEL
        if reasoning_effort is None:
            from main import REASONING_EFFORT as DEFAULT_REASONING_EFFORT
            reasoning_effort = DEFAULT_REASONING_EFFORT
        
        from main import ROLE_CONFIGS
        
        self.num_games = num_games
        self.num_players = num_players
        self.model = model
        self.reasoning_effort = reasoning_effort
        self.player_names = ROLE_CONFIGS[num_players]["names"]
        
        # Only create memories for specified players
        if memory_enabled_players is None:
            # Default: all players have memory
            self.memory_enabled_players = self.player_names
        else:
            # Only specified players have memory
            self.memory_enabled_players = [p for p in memory_enabled_players if p in self.player_names]
        
        self.player_memories: Dict[str, PlayerMemory] = {
            name: PlayerMemory(player_name=name, reflections=[])
            for name in self.memory_enabled_players
        }
        self.game_results: List[GameState] = []
        self.game_reflections: Dict[int, List[PlayerReflection]] = {}
        self.session_id = f"avalon_tournament_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.tournament_dir = os.path.join(self.base_dir, self.session_id)
        os.makedirs(self.tournament_dir, exist_ok=True)
        print(f"Tournament folder created: {self.tournament_dir}")
        print(f"Players: {self.num_players}, Model: {self.model}, Reasoning: {self.reasoning_effort}")
        print(f"Memory-enabled players: {', '.join(self.memory_enabled_players)}")
    
    def run_post_game_reflection(self, game_state: GameState, game_number: int):
        print(f"\n{'='*60}")
        print(f"POST-GAME REFLECTION - Game {game_number}")
        print(f"{'='*60}")
        
        game_reflections = []
        
        for player in game_state.players:
            # Only run reflections for memory-enabled players
            if player.name not in self.memory_enabled_players:
                print(f"\n  {player.name} ({player.role}) - skipping reflection (no memory)")
                continue
            
            print(f"\n  {player.name} ({player.role}) reflecting...")
            
            if game_state.winner == "good" and player.is_good:
                result = "won"
            elif game_state.winner == "evil" and not player.is_good:
                result = "won"
            else:
                result = "lost"
            
            context = f"You are {player.name}. You just finished Game {game_number} of Avalon.\n\n"
            context += f"YOUR ROLE: {player.role.upper()}\n"
            context += f"GAME RESULT: You {result} (Team {game_state.winner} won)\n\n"
            
            context += "GAME SUMMARY:\n"
            for mission in game_state.missions:
                final_proposal = mission.proposals[mission.final_team_index]
                context += f"  Mission {mission.mission_number}: Leader {final_proposal.leader}, Team {final_proposal.team_members}\n"
                if mission.mission_result:
                    context += f"    Result: {mission.mission_result} ({mission.fail_count} FAIL cards)\n"
            
            if game_state.assassin_phase:
                context += "\nASSASSIN PHASE:\n"
                context += f"  Assassin guessed: {game_state.assassin_phase.guess}\n"
                context += f"  Correct: {game_state.assassin_phase.correct}\n"
                context += f"  Actual Merlin was: {next(p.name for p in game_state.players if p.role == 'merlin')}\n"
            
            context += "\nACTUAL ROLES (NOW REVEALED):\n"
            for p in game_state.players:
                context += f"  {p.name}: {p.role}\n"
            
            from main import client
            import time
            
            system_prompt = context
            user_prompt = (
                "Reflect on your performance in this game. Respond with JSON:\n"
                "{\n"
                '  "self_assessment": "What you did well and what you could improve (2-3 sentences)",\n'
                '  "player_observations": {\n'
                '    "PlayerName1": "Brief observation about their playstyle or patterns",\n'
                '    "PlayerName2": "Brief observation about their playstyle or patterns",\n'
                "    ...\n"
                "  }\n"
                "}\n"
                "Make observations about ALL other players (not yourself)."
            )
            
            start_time = time.time()
            try:
                response = client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    reasoning_effort=self.reasoning_effort
                )
                thinking_time = time.time() - start_time
                response_text = response.choices[0].message.content.strip()
                
                data = json.loads(response_text)
                self_assessment = data.get("self_assessment", "No reflection provided.")
                player_observations = data.get("player_observations", {})
                
            except Exception as e:
                thinking_time = time.time() - start_time
                print(f"    Error during reflection: {e}")
                self_assessment = "Unable to reflect on this game."
                player_observations = {}
            
            reflection = PlayerReflection(
                game_number=game_number,
                player_name=player.name,
                role_played=player.role,
                game_result=result,
                self_assessment=self_assessment,
                player_observations=player_observations,
                thinking_time=thinking_time
            )
            
            self.player_memories[player.name].reflections.append(reflection)
            game_reflections.append(reflection)
            
            print(f"    ({thinking_time:.2f}s) Self: {self_assessment}")
            print(f"    Observations: {len(player_observations)} players")
        
        self.game_reflections[game_number] = game_reflections
    
    def run_tournament(self):
        print(f"\n{'='*60}")
        print(f"STARTING AVALON TOURNAMENT: {self.session_id}")
        print(f"Playing {self.num_games} games with {self.num_players} players")
        print(f"{'='*60}")
        
        for game_num in range(1, self.num_games + 1):
            print(f"\n\n{'#'*60}")
            print(f"# GAME {game_num}/{self.num_games}")
            print(f"{'#'*60}")
            
            game = LearningAvalonGame(
                player_memories=self.player_memories,
                num_players=self.num_players,
                model=self.model,
                reasoning_effort=self.reasoning_effort
            )
            game_state = game.play_game()
            self.game_results.append(game_state)
            self.run_post_game_reflection(game_state, game_num)
            self.save_progress()
        
        print("\n\n" + "="*60)
        print("TOURNAMENT COMPLETE!")
        print("="*60)
        self.print_statistics()
        self.save_tournament_summary()
    
    def print_statistics(self):
        total_games = len(self.game_results)
        good_wins = sum(1 for g in self.game_results if g.winner == "good")
        evil_wins = total_games - good_wins
        
        print("\nTOURNAMENT STATISTICS:")
        print(f"  Total Games: {total_games}")
        print(f"  Good Wins: {good_wins} ({good_wins/total_games*100:.1f}%)")
        print(f"  Evil Wins: {evil_wins} ({evil_wins/total_games*100:.1f}%)")
        
        assassin_games = [g for g in self.game_results if g.assassin_phase]
        if assassin_games:
            assassin_correct = sum(1 for g in assassin_games if g.assassin_phase.correct)
            print(f"  Assassin Success: {assassin_correct}/{len(assassin_games)} ({assassin_correct/len(assassin_games)*100:.1f}%)")
        
        print("\nPLAYER REFLECTION SUMMARY:")
        for player_name in self.player_names:
            reflections = self.player_memories[player_name].reflections
            wins = sum(1 for r in reflections if r.game_result == "won")
            print(f"  {player_name}: {wins}/{len(reflections)} games won ({wins/len(reflections)*100:.1f}%)")
    
    def save_tournament_summary(self):
        summary_file = os.path.join(self.tournament_dir, "tournament_summary.txt")
        
        total_games = len(self.game_results)
        good_wins = sum(1 for g in self.game_results if g.winner == "good")
        evil_wins = total_games - good_wins
        
        with open(summary_file, 'w') as f:
            f.write("AVALON TOURNAMENT SUMMARY\n")
            f.write("="*60 + "\n\n")
            f.write(f"Session ID: {self.session_id}\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # Add memory configuration info
            f.write("MEMORY CONFIGURATION:\n")
            if len(self.memory_enabled_players) == len(self.player_names):
                f.write("  All players have memory enabled\n")
            else:
                f.write(f"  Memory-enabled players: {', '.join(self.memory_enabled_players)}\n")
                no_memory = [p for p in self.player_names if p not in self.memory_enabled_players]
                f.write(f"  No-memory players: {', '.join(no_memory)}\n")
            f.write("\n")
            
            if self.game_results:
                config = self.game_results[0].config
                f.write("GAME CONFIGURATION:\n")
                f.write(f"  Model: {config.model}\n")
                f.write(f"  Reasoning Effort: {config.reasoning_effort}\n")
                f.write(f"  Mission Team Sizes: {config.mission_team_sizes}\n")
                f.write(f"  Messages Per Player: {config.num_messages_per_player}\n\n")
            
            f.write("TOURNAMENT STATISTICS:\n")
            f.write(f"  Total Games: {total_games}\n")
            f.write(f"  Good Wins: {good_wins} ({good_wins/total_games*100:.1f}%)\n")
            f.write(f"  Evil Wins: {evil_wins} ({evil_wins/total_games*100:.1f}%)\n\n")
            
            assassin_games = [g for g in self.game_results if g.assassin_phase]
            if assassin_games:
                assassin_correct = sum(1 for g in assassin_games if g.assassin_phase.correct)
                f.write(f"  Assassin Phase Triggered: {len(assassin_games)} times\n")
                f.write(f"  Assassin Success Rate: {assassin_correct}/{len(assassin_games)} ({assassin_correct/len(assassin_games)*100:.1f}%)\n\n")
            
            f.write("PLAYER STATISTICS:\n")
            for player_name in self.player_names:
                f.write(f"  {player_name}:")
                
                # Indicate if player has memory
                if player_name in self.memory_enabled_players:
                    f.write(" [MEMORY ENABLED]\n")
                else:
                    f.write(" [NO MEMORY]\n")
                
                # Only show reflection stats for memory-enabled players
                if player_name in self.player_memories:
                    reflections = self.player_memories[player_name].reflections
                    wins = sum(1 for r in reflections if r.game_result == "won")
                    f.write(f"    Games Won: {wins}/{len(reflections)} ({wins/len(reflections)*100:.1f}%)\n")
                    
                    roles = {}
                    for r in reflections:
                        roles[r.role_played] = roles.get(r.role_played, 0) + 1
                    f.write(f"    Roles Played: {', '.join(f'{role}({count})' for role, count in sorted(roles.items()))}\n")
                else:
                    f.write("    (No reflection data - memory disabled)\n")
            
            f.write("\n" + "="*60 + "\n")
            f.write("Files Generated:\n")
            f.write("  - player_memories.json: All player reflections and observations\n")
            f.write(f"  - all_games.json: Complete data for all {total_games} games\n")
            f.write("  - individual_games/: Individual JSON files for each game\n")
            f.write("  - tournament_summary.txt: This summary file\n")
        
        print("\n📊 Tournament summary saved to: tournament_summary.txt")
    
    def save_progress(self):
        memories_data = {
            "session_id": self.session_id,
            "num_games": len(self.game_results),
            "memory_enabled_players": self.memory_enabled_players,
            "all_players": self.player_names,
            "player_memories": {
                name: {
                    "player_name": memory.player_name,
                    "reflections": [asdict(r) for r in memory.reflections]
                }
                for name, memory in self.player_memories.items()
            }
        }
        
        memories_file = os.path.join(self.tournament_dir, "player_memories.json")
        with open(memories_file, 'w') as f:
            json.dump(memories_data, f, indent=2)
        
        def convert_to_dict(obj):
            if hasattr(obj, '__dataclass_fields__'):
                return {k: convert_to_dict(v) for k, v in asdict(obj).items()}
            elif isinstance(obj, list):
                return [convert_to_dict(item) for item in obj]
            else:
                return obj
        
        games_data = {
            "session_id": self.session_id,
            "total_games": len(self.game_results),
            "memory_enabled_players": self.memory_enabled_players,
            "all_players": self.player_names,
            "games": [convert_to_dict(game) for game in self.game_results]
        }
        
        games_file = os.path.join(self.tournament_dir, "all_games.json")
        with open(games_file, 'w') as f:
            json.dump(games_data, f, indent=2)
        
        games_dir = os.path.join(self.tournament_dir, "individual_games")
        os.makedirs(games_dir, exist_ok=True)
        
        for idx, game in enumerate(self.game_results, 1):
            game_dict = convert_to_dict(game)
            
            if idx in self.game_reflections:
                game_dict["post_game_reflections"] = [
                    asdict(reflection) for reflection in self.game_reflections[idx]
                ]
            
            individual_game_file = os.path.join(games_dir, f"game_{idx:02d}.json")
            with open(individual_game_file, 'w') as f:
                json.dump(game_dict, f, indent=2)
        
        print(f"\n📁 Progress saved to: {self.tournament_dir}")
        print("    - player_memories.json")
        print("    - all_games.json")
        print(f"    - individual_games/ (game_01.json - game_{len(self.game_results):02d}.json)")


def main():
    """Main entry point for multi-game tournament."""
    
    # Check for API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable not set!")
        print("Please set it with: export OPENAI_API_KEY='your-api-key'")
        return
    
    # Parse command line arguments
    import sys
    
    num_games = 10
    num_players = 5
    model = None  # Will use default from main.py
    reasoning_effort = None  # Will use default from main.py
    memory_enabled_players = None  # Default: all players have memory
    
    # Simple argument parsing
    for i, arg in enumerate(sys.argv[1:]):
        if arg == "--num-games" and i + 1 < len(sys.argv) - 1:
            num_games = int(sys.argv[i + 2])
        elif arg == "--num-players" and i + 1 < len(sys.argv) - 1:
            num_players = int(sys.argv[i + 2])
        elif arg == "--model" and i + 1 < len(sys.argv) - 1:
            model = sys.argv[i + 2]
        elif arg == "--reasoning-effort" and i + 1 < len(sys.argv) - 1:
            reasoning_effort = sys.argv[i + 2]
        elif arg == "--memory-players" and i + 1 < len(sys.argv) - 1:
            # Comma-separated list of player names
            memory_enabled_players = [p.strip() for p in sys.argv[i + 2].split(',')]
    
    # Create and run tournament
    runner = MultiGameRunner(
        num_games=num_games,
        num_players=num_players,
        model=model,
        reasoning_effort=reasoning_effort,
        memory_enabled_players=memory_enabled_players
    )
    runner.run_tournament()
    
    print("\n" + "="*60)
    print("TOURNAMENT GENERATION COMPLETE!")
    print("="*60)


if __name__ == "__main__":
    main()

