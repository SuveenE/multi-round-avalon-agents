import os
import json
import random
import time
from datetime import datetime
from typing import List, Optional
from dataclasses import dataclass, asdict
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

MODEL = "gpt-5.1"
REASONING_EFFORT = "low"
NUM_MESSAGES_PER_PLAYER = 1

MISSION_TEAM_SIZES = {
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5]
}

ROLE_CONFIGS = {
    5: {
        "roles": ["merlin", "good", "good", "assassin", "evil"],
        "names": ["Alice", "Bob", "Charlie", "Diana", "Eve"]
    },
    6: {
        "roles": ["merlin", "percival", "good", "good", "morgana", "mordred"],
        "names": ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"],
        "assassin_role": "mordred"
    },
    7: {
        "roles": ["merlin", "percival", "good", "good", "morgana", "mordred", "oberon"],
        "names": ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace"],
        "assassin_role": "morgana"
    },
    8: {
        "roles": ["merlin", "percival", "good", "good", "good", "morgana", "mordred", "assassin"],
        "names": ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"]
    },
    9: {
        "roles": ["merlin", "percival", "good", "good", "good", "good", "morgana", "mordred", "assassin"],
        "names": ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Iris"]
    },
    10: {
        "roles": ["merlin", "percival", "good", "good", "good", "good", "morgana", "mordred", "oberon", "assassin"],
        "names": ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Iris", "Jack"]
    }
}

@dataclass
class Player:
    name: str
    role: str
    is_good: bool
    special_knowledge: List[str]
    
@dataclass
class Message:
    player: str
    content: str
    timestamp: int
    global_turn_id: int
    phase: str
    thinking_time: float
    reasoning_content: Optional[str] = None
    
@dataclass
class TeamProposal:
    leader: str
    team_members: List[str]
    reasoning: str
    thinking_time: float
    reasoning_content: Optional[str] = None
    
@dataclass
class Vote:
    player: str
    vote: str
    comment: str
    thinking_time: float
    reasoning_content: Optional[str] = None
    
@dataclass
class MissionAction:
    player: str
    action: str

@dataclass
class Proposal:
    proposal_id: int
    leader: str
    team_members: List[str]
    reasoning: str
    thinking_time: float
    reasoning_content: Optional[str]
    votes: List[Vote]
    vote_result: str
    
@dataclass
class Mission:
    mission_number: int
    proposals: List[Proposal]
    final_team_index: int
    discussion: List[Message]
    quest_actions: Optional[List[MissionAction]]
    mission_result: Optional[str]
    fail_count: Optional[int]
    
@dataclass
class AssassinPhase:
    assassin: str
    evil_discussion: List[Message]
    guess: str
    reasoning: str
    correct: bool
    thinking_time: float
    reasoning_content: Optional[str] = None

@dataclass
class GameConfig:
    model: str
    reasoning_effort: str
    mission_team_sizes: List[int]
    num_messages_per_player: int
    num_players: int
    
@dataclass
class GameState:
    game_id: str
    config: GameConfig
    players: List[Player]
    missions: List[Mission]
    winner: Optional[str]
    assassin_phase: Optional[AssassinPhase]


class AvalonGame:
    def __init__(self, num_players: int = 5, model: str = MODEL, reasoning_effort: str = REASONING_EFFORT):
        self.game_id = f"avalon_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.model = model
        self.reasoning_effort = reasoning_effort
        self.num_players = num_players
        self.players: List[Player] = []
        self.missions: List[Mission] = []
        self.current_leader_idx = random.randint(0, num_players - 1)
        self.good_wins = 0
        self.evil_wins = 0
        self.quests_completed = 0
        self.global_turn_counter = 0
        
    def setup_game(self):
        config = ROLE_CONFIGS[self.num_players]
        player_names = config["names"]
        roles = config["roles"].copy()
        random.shuffle(roles)
        
        # Determine who is the assassin
        assassin_role = config.get("assassin_role", "assassin")
        
        evil_players = []
        morgana_player = None
        merlin_player = None
        
        for name, role in zip(player_names, roles):
            is_good = role in ["merlin", "percival", "good"]
            special_knowledge = []
            
            if role in ["evil", "assassin", "morgana", "mordred", "oberon"]:
                evil_players.append(name)
            
            if role == "morgana":
                morgana_player = name
            if role == "merlin":
                merlin_player = name
                
            player = Player(name=name, role=role, is_good=is_good, special_knowledge=special_knowledge)
            self.players.append(player)
        
        # Store who the assassin is (for games where assassin is dual role)
        self.assassin_role = assassin_role
        
        for player in self.players:
            if player.role == "merlin":
                player.special_knowledge = [p for p in evil_players if self.players[[pl.name for pl in self.players].index(p)].role != "mordred"]
            elif player.role == "percival":
                if morgana_player:
                    player.special_knowledge = [merlin_player, morgana_player]
                else:
                    player.special_knowledge = [merlin_player]
            elif player.role == "oberon":
                player.special_knowledge = []
            elif player.role in ["evil", "assassin", "morgana", "mordred"]:
                player.special_knowledge = [p for p in evil_players if p != player.name and self.players[[pl.name for pl in self.players].index(p)].role != "oberon"]
        
        print(f"Game initialized: {self.game_id} ({self.num_players} players)")
        for player in self.players:
            assassin_marker = " [ASSASSIN]" if player.role == self.assassin_role else ""
            print(f"  {player.name}: {player.role}{assassin_marker} (knows: {player.special_knowledge})")
    
    def get_player_context(self, player: Player, mission_num: int) -> str:
        context = f"You are {player.name}, playing The Resistance: Avalon.\n\n"
        context += f"YOUR ROLE: {player.role.upper()}\n"
        
        role = player.role
        if role == "merlin":
            context += f"You are Merlin. You know these evil players: {', '.join(player.special_knowledge)}.\n"
            context += "Help good win WITHOUT revealing your identity, or the Assassin will kill you!\n"
        elif role == "percival":
            context += f"You are Percival (good team). You see these players as Merlin: {', '.join(player.special_knowledge)}.\n"
            context += "One is the real Merlin, one might be Morgana (evil). Protect Merlin!\n"
        elif role == "assassin" or (role == self.assassin_role and role in ["morgana", "mordred"]):
            if player.special_knowledge:
                context += f"You are the Assassin (evil team). Your evil teammates are: {', '.join(player.special_knowledge)}.\n"
            else:
                context += "You are the Assassin (evil team).\n"
            context += "Sabotage missions. If good wins 3 missions, you guess who Merlin is!\n"
        elif role == "morgana":
            context += f"You are Morgana (evil team). Your evil teammates are: {', '.join(player.special_knowledge)}.\n"
            context += "You appear as Merlin to Percival. Deceive and sabotage!\n"
        elif role == "mordred":
            context += f"You are Mordred (evil team). Your evil teammates are: {', '.join(player.special_knowledge)}.\n"
            context += "You are invisible to Merlin. Sabotage missions!\n"
        elif role == "oberon":
            context += "You are Oberon (evil team). You don't know who your teammates are, and they don't know you.\n"
            context += "Sabotage missions and try to identify your team!\n"
        elif role == "evil":
            context += f"You are on the evil team. Your evil teammates are: {', '.join(player.special_knowledge)}.\n"
            context += "Sabotage missions and deceive the good players!\n"
        else:
            context += "You are on the good team. Deduce who the evil players are and ensure missions succeed!\n"
        
        context += f"\nALL PLAYERS: {', '.join([p.name for p in self.players])}\n"
        
        # Calculate good vs evil count
        good_count = sum(1 for p in self.players if p.is_good)
        evil_count = len(self.players) - good_count
        context += f"TEAM COMPOSITION: {good_count} Good, {evil_count} Evil\n"
        
        context += f"\nQUEST {self.quests_completed + 1}/5 - Team size needed: {MISSION_TEAM_SIZES[self.num_players][self.quests_completed]}\n"
        context += f"Score - Good: {self.good_wins}, Evil: {self.evil_wins}\n\n"
        
        # Add mission history
        if self.missions:
            context += "PREVIOUS MISSIONS:\n"
            for m in self.missions:
                approved_proposal = m.proposals[m.final_team_index]
                context += f"  Mission {m.mission_number}: Leader {approved_proposal.leader}, Team {approved_proposal.team_members}\n"
                # Show voting summary (approve/reject counts) but NOT individual reasoning
                if m.proposals:
                    approve_count = sum(1 for v in approved_proposal.votes if v.vote == "approve")
                    reject_count = len(approved_proposal.votes) - approve_count
                    context += f"    Votes: {approve_count} approve, {reject_count} reject"
                    if len(m.proposals) > 1:
                        context += f" (after {len(m.proposals)} proposals)"
                    context += "\n"
                # Show mission results
                if m.mission_result:
                    context += f"    Result: {m.mission_result} ({m.fail_count} FAIL cards)\n"
                else:
                    context += "    Result: Team proposal rejected, no quest\n"
        
        return context
    
    def call_llm(self, system_prompt: str, user_prompt: str, response_format: str = "text") -> tuple[str, float, Optional[str]]:
        """Call OpenAI API with reasoning effort. Returns (response, time_taken, reasoning_summary)."""
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
            elapsed_time = time.time() - start_time
            
            # Extract response content
            content = response.choices[0].message.content.strip()
            
            # Extract reasoning summary if available
            # Check various possible locations for reasoning content
            reasoning_summary = None
            
            # Check if there's a reasoning field in the response
            if hasattr(response, 'reasoning'):
                if hasattr(response.reasoning, 'summary'):
                    summary_parts = []
                    for item in response.reasoning.summary:
                        if hasattr(item, 'text'):
                            summary_parts.append(item.text)
                    if summary_parts:
                        reasoning_summary = "\n".join(summary_parts)
            
            # Check if there's reasoning in the message
            if not reasoning_summary and hasattr(response.choices[0].message, 'reasoning_content'):
                reasoning_summary = response.choices[0].message.reasoning_content
            
            return content, elapsed_time, reasoning_summary
        except Exception as e:
            elapsed_time = time.time() - start_time
            print("API Error: {}".format(e))
            # Fallback response
            return "I need to think about this carefully...", elapsed_time, None
    
    def generate_discussion(self, quest_num: int) -> List[Message]:
        """Generate discussion phase with LLM agents."""
        print(f"\n=== Quest {quest_num}: Discussion Phase ===")
        messages = []
        
        # Each player speaks NUM_MESSAGES_PER_PLAYER times
        for round_num in range(NUM_MESSAGES_PER_PLAYER):
            for player in self.players:
                context = self.get_player_context(player, quest_num)
                
                # Add conversation history
                if messages:
                    context += "\nCONVERSATION SO FAR:\n"
                    for msg in messages:
                        context += f"  {msg.player}: {msg.content}\n"
                
                system_prompt = context
                user_prompt = "It's your turn to speak. Provide a strategic comment about who to trust or who should be on the mission team. Be natural and conversational. Keep it to 1-2 sentences."
                
                if player.role == "evil" or player.role == "assassin":
                    user_prompt += " Remember to deceive and create confusion while appearing trustworthy."
                elif player.role == "merlin":
                    user_prompt += " Subtly guide the team without revealing you know who the evil players are."
                
                response, thinking_time, reasoning_content = self.call_llm(system_prompt, user_prompt)
                
                message = Message(
                    player=player.name,
                    content=response,
                    timestamp=len(messages),
                    global_turn_id=self.global_turn_counter,
                    phase="discussion",
                    thinking_time=thinking_time,
                    reasoning_content=reasoning_content
                )
                messages.append(message)
                self.global_turn_counter += 1
                
                # Print with reasoning indicator if available
                print(f"  {player.name} ({thinking_time:.2f}s): {response}")
        
        return messages
    
    def generate_team_proposal(self, leader: Player, quest_num: int, discussion: List[Message]) -> TeamProposal:
        """Leader proposes a team using LLM."""
        context = self.get_player_context(leader, quest_num)
        
        # Add the discussion that just happened
        if discussion:
            context += "\nDISCUSSION FROM THIS MISSION:\n"
            for msg in discussion:
                context += f"  {msg.player}: {msg.content}\n"
        
        team_size = MISSION_TEAM_SIZES[self.num_players][quest_num - 1]
        player_names = [p.name for p in self.players]
        
        system_prompt = context
        user_prompt = "You are the mission leader. Propose a team of {} players for this mission.\n".format(team_size)
        user_prompt += "Available players: {}\n".format(', '.join(player_names))
        user_prompt += "Respond ONLY with a JSON object: {{\"team\": [\"Name1\", \"Name2\", ...], \"reasoning\": \"why you chose this team\"}}"
        
        response, thinking_time, reasoning_content = self.call_llm(system_prompt, user_prompt)
        
        # Parse response
        try:
            data = json.loads(response)
            team = data["team"][:team_size]  # Ensure correct size
            reasoning = data["reasoning"]
        except (json.JSONDecodeError, KeyError):
            # Fallback: random team
            team = random.sample(player_names, team_size)
            reasoning = "Based on trust and past mission results."
        
        proposal = TeamProposal(
            leader=leader.name,
            team_members=team,
            reasoning=reasoning,
            thinking_time=thinking_time,
            reasoning_content=reasoning_content
        )
        
        print(f"  Leader {leader.name} ({thinking_time:.2f}s) proposes: {team}")
        print(f"  Reasoning: {reasoning}")
        
        return proposal
    
    def generate_votes(self, proposal: TeamProposal, quest_num: int, discussion: List[Message], previous_proposals: List[Proposal] = None) -> List[Vote]:
        """All players vote on the team proposal."""
        votes = []
        
        for player in self.players:
            context = self.get_player_context(player, quest_num)
            
            # Add the discussion that just happened
            if discussion:
                context += "\nDISCUSSION FROM THIS MISSION:\n"
                for msg in discussion:
                    context += f"  {msg.player}: {msg.content}\n"
            
            # Add previous rejected proposals from THIS mission
            if previous_proposals:
                context += "\nPREVIOUS PROPOSALS THIS MISSION:\n"
                for prev_prop in previous_proposals:
                    context += f"  Proposal {prev_prop.proposal_id + 1} by {prev_prop.leader}: {prev_prop.team_members}\n"
                    if prev_prop.votes:  # Only show vote counts if votes exist (not 5th proposal)
                        approve_count = sum(1 for v in prev_prop.votes if v.vote == "approve")
                        reject_count = len(prev_prop.votes) - approve_count
                        context += f"    Result: REJECTED ({approve_count} approve, {reject_count} reject)\n"
            
            context += f"\nPROPOSED TEAM: {', '.join(proposal.team_members)}\n"
            context += f"Leader's reasoning: {proposal.reasoning}\n"
            
            system_prompt = context
            user_prompt = "Vote on this team proposal. Respond ONLY with JSON: {\"vote\": \"approve\" or \"reject\", \"comment\": \"brief reason\"}"
            
            response, thinking_time, reasoning_content = self.call_llm(system_prompt, user_prompt)
            
            try:
                data = json.loads(response)
                vote_choice = data["vote"]
                comment = data["comment"]
            except (json.JSONDecodeError, KeyError):
                # Strategic fallback
                if player.role in ["evil", "assassin"]:
                    # Evil players more likely to reject good teams
                    vote_choice = random.choice(["approve", "reject"])
                else:
                    vote_choice = "approve"
                comment = "I trust this team." if vote_choice == "approve" else "I'm not sure about this team."
            
            vote = Vote(
                player=player.name,
                vote=vote_choice,
                comment=comment,
                thinking_time=thinking_time,
                reasoning_content=reasoning_content
            )
            votes.append(vote)
            print(f"  {player.name} ({thinking_time:.2f}s): {vote_choice} - {comment}")
        
        return votes
    
    def execute_mission(self, proposal: Proposal, quest_num: int) -> tuple[List[MissionAction], str, int]:
        print(f"\n=== Quest {quest_num}: Execution Phase ===")
        actions = []
        
        for player_name in proposal.team_members:
            player = next(p for p in self.players if p.name == player_name)
            context = self.get_player_context(player, quest_num)
            
            system_prompt = context
            
            if player.is_good:
                action_choice = "success"
            else:
                user_prompt = "You're on the mission. As an evil player, choose 'success' or 'fail' strategically. Respond with JSON: {\"action\": \"success\" or \"fail\", \"reasoning\": \"why\"}"
                response, thinking_time, reasoning_content = self.call_llm(system_prompt, user_prompt)
                try:
                    data = json.loads(response)
                    action_choice = data["action"]
                except (json.JSONDecodeError, KeyError):
                    action_choice = "fail"
            
            action = MissionAction(player=player_name, action=action_choice)
            actions.append(action)
        
        # Determine mission result
        fail_count = sum(1 for a in actions if a.action == "fail")
        result = "fail" if fail_count > 0 else "success"
        
        print(f"  Quest result: {result} ({fail_count} FAIL cards)")
        
        return actions, result, fail_count
    
    def run_mission(self, mission_num: int) -> Mission:
        """Run a complete mission round with up to 5 proposal attempts."""
        MAX_PROPOSALS = 5
        proposals = []
        discussion = None
        
        # Discussion phase (happens once at start of mission)
        discussion = self.generate_discussion(self.quests_completed + 1)
        
        # Try up to 5 proposals
        for proposal_id in range(MAX_PROPOSALS):
            leader = self.players[self.current_leader_idx]
            
            print(f"\n--- Proposal {proposal_id + 1}/5 (Leader: {leader.name}) ---")
            
            # Team proposal
            team_proposal = self.generate_team_proposal(leader, self.quests_completed + 1, discussion)
            
            # 5th proposal auto-approves without voting (AvalonBench rule)
            if proposal_id == MAX_PROPOSALS - 1:
                vote_result = "approved"
                votes = []  # No voting on 5th proposal
                print("  Vote result: AUTO-APPROVED (5th proposal, no voting)")
            else:
                # Voting for proposals 1-4
                votes = self.generate_votes(team_proposal, self.quests_completed + 1, discussion, proposals)
                approve_count = sum(1 for v in votes if v.vote == "approve")
                vote_result = "approved" if approve_count > len(self.players) // 2 else "rejected"
                print(f"  Vote result: {vote_result} ({approve_count}/{len(self.players)})")
            
            # Create proposal object
            proposal = Proposal(
                proposal_id=proposal_id,
                leader=leader.name,
                team_members=team_proposal.team_members,
                reasoning=team_proposal.reasoning,
                thinking_time=team_proposal.thinking_time,
                reasoning_content=team_proposal.reasoning_content,
                votes=votes,
                vote_result=vote_result
            )
            proposals.append(proposal)
            
            if vote_result == "approved":
                break
            else:
                # Rotate leader for next proposal
                self.current_leader_idx = (self.current_leader_idx + 1) % len(self.players)
        
        # Get the approved proposal (guaranteed to exist due to 5th proposal rule)
        final_team_index = len(proposals) - 1
        approved_proposal = proposals[final_team_index]
        
        # Mission execution
        quest_actions, mission_result, fail_count = self.execute_mission(approved_proposal, self.quests_completed + 1)
        
        # Update quest counters
        if mission_result == "success":
            self.good_wins += 1
        else:
            self.evil_wins += 1
        self.quests_completed += 1
        
        mission = Mission(
            mission_number=mission_num,
            proposals=proposals,
            final_team_index=final_team_index,
            discussion=discussion,
            quest_actions=quest_actions,
            mission_result=mission_result,
            fail_count=fail_count
        )
        
        self.missions.append(mission)
        self.current_leader_idx = (self.current_leader_idx + 1) % len(self.players)
        
        return mission
    
    def run_assassin_phase(self) -> AssassinPhase:
        print("\n=== Assassin Phase ===")
        
        # Find the assassin (could be dedicated assassin role or a dual-role player)
        assassin = next(p for p in self.players if p.role == self.assassin_role)
        merlin = next(p for p in self.players if p.role == "merlin")
        evil_players = [p for p in self.players if not p.is_good]
        
        print("\n🗡️  Evil team reveals themselves and discusses who Merlin might be...")
        
        # Evil team discussion
        evil_discussion = []
        
        for round_num in range(1):  # 1 round of discussion
            for evil_player in evil_players:
                # Build context for evil player
                context = f"You are {evil_player.name}, playing The Resistance: Avalon.\n\n"
                context += f"YOUR ROLE: {evil_player.role.upper()}\n"
                context += f"EVIL TEAM MEMBERS: {', '.join([p.name for p in evil_players])}\n"
                context += "The good team won 3 quests! The evil team has revealed themselves and is discussing who Merlin might be.\n"
                context += "The Assassin will make the final decision, but everyone should share their analysis.\n\n"
                
                # Add all game discussions for analysis
                context += "ALL GAME DISCUSSIONS:\n"
                for mission in self.missions:
                    context += f"\nMission {mission.mission_number} Discussion:\n"
                    for msg in mission.discussion:
                        context += f"  {msg.player}: {msg.content}\n"
                
                # Add current evil discussion
                if evil_discussion:
                    context += "\nEVIL TEAM DISCUSSION SO FAR:\n"
                    for msg in evil_discussion:
                        context += f"  {msg.player}: {msg.content}\n"
                
                system_prompt = context
                user_prompt = "Discuss who you think Merlin is among the good players. Analyze their behavior and statements in first person (as yourself). Be specific and analytical. Keep it to 2-3 sentences. Speak naturally as if talking to your evil teammates."
                
                response, thinking_time, reasoning_content = self.call_llm(system_prompt, user_prompt)
                
                message = Message(
                    player=evil_player.name,
                    content=response,
                    timestamp=len(evil_discussion),
                    global_turn_id=self.global_turn_counter,
                    phase="evil_discussion",
                    thinking_time=thinking_time,
                    reasoning_content=reasoning_content
                )
                evil_discussion.append(message)
                self.global_turn_counter += 1
                print(f"  {evil_player.name} ({thinking_time:.2f}s): {response}")
        
        # Now Assassin makes the final decision
        print("\n🗡️  Assassin makes the final decision...")
        
        context = f"You are {assassin.name}, the Assassin in The Resistance: Avalon.\n\n"
        context += f"EVIL TEAM MEMBERS: {', '.join([p.name for p in evil_players])}\n"
        context += "The good team won 3 quests! You get ONE chance to identify and kill Merlin.\n"
        context += "Your evil teammates have discussed and shared their analysis.\n\n"
        
        # Add all game discussions
        context += "ALL GAME DISCUSSIONS:\n"
        for mission in self.missions:
            context += f"\nMission {mission.mission_number} Discussion:\n"
            for msg in mission.discussion:
                context += f"  {msg.player}: {msg.content}\n"
        
        # Add evil team discussion
        context += "\nEVIL TEAM DISCUSSION:\n"
        for msg in evil_discussion:
            context += f"  {msg.player}: {msg.content}\n"
        
        system_prompt = context
        user_prompt = "Based on all the discussions and your teammates' analysis, choose who you think is Merlin from the good players. Respond ONLY with JSON: {{\"guess\": \"PlayerName\", \"reasoning\": \"your analysis in 2-3 sentences\"}}"
        
        response, thinking_time, reasoning_content = self.call_llm(system_prompt, user_prompt)
        
        try:
            data = json.loads(response)
            guess = data["guess"]
            reasoning = data["reasoning"]
        except (json.JSONDecodeError, KeyError):
            good_players = [p.name for p in self.players if p.is_good]
            guess = random.choice(good_players)
            reasoning = "Based on their behavior throughout the game."
        
        correct = (guess == merlin.name)
        
        print(f"  Assassin {assassin.name} ({thinking_time:.2f}s) guesses: {guess}")
        print(f"  Reasoning: {reasoning}")
        print(f"  Correct: {correct}")
        
        return AssassinPhase(
            assassin=assassin.name,
            evil_discussion=evil_discussion,
            guess=guess,
            reasoning=reasoning,
            correct=correct,
            thinking_time=thinking_time,
            reasoning_content=reasoning_content
        )
    
    def play_game(self) -> GameState:
        """Play a complete game of Avalon."""
        print(f"\n{'='*60}")
        print(f"STARTING AVALON GAME: {self.game_id}")
        print(f"{'='*60}")
        
        self.setup_game()
        
        # Play until 3 quests succeed or 3 quests fail (based on ACTUAL quest results)
        mission_num = 1
        while self.quests_completed < 5 and self.good_wins < 3 and self.evil_wins < 3:
            self.run_mission(mission_num)
            mission_num += 1
        
        # Determine winner
        assassin_phase = None
        
        if self.good_wins >= 3:
            # Assassin phase
            assassin_phase = self.run_assassin_phase()
            if assassin_phase.correct:
                winner = "evil"
                print("\n🗡️  EVIL WINS! The Assassin killed Merlin!")
            else:
                winner = "good"
                print("\n✨ GOOD WINS! Merlin survived!")
        else:
            winner = "evil"
            print("\n🗡️  EVIL WINS! Three missions failed!")
        
        print(f"\nFinal Score - Good: {self.good_wins}, Evil: {self.evil_wins}")
        
        config = GameConfig(
            model=self.model,
            reasoning_effort=self.reasoning_effort,
            mission_team_sizes=MISSION_TEAM_SIZES[self.num_players],
            num_messages_per_player=NUM_MESSAGES_PER_PLAYER,
            num_players=self.num_players
        )
        
        game_state = GameState(
            game_id=self.game_id,
            config=config,
            players=self.players,
            missions=self.missions,
            winner=winner,
            assassin_phase=assassin_phase
        )
        
        return game_state
    
    def save_game(self, game_state: GameState, filename: str):
        def convert_to_dict(obj):
            if hasattr(obj, '__dataclass_fields__'):
                return {k: convert_to_dict(v) for k, v in asdict(obj).items()}
            elif isinstance(obj, list):
                return [convert_to_dict(item) for item in obj]
            else:
                return obj
        
        data = convert_to_dict(game_state)
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"\n📁 Game saved to: {filename}")


def main():
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable not set!")
        return
    
    import sys
    num_players = 5
    for i, arg in enumerate(sys.argv[1:]):
        if arg == "--num-players" and i + 1 < len(sys.argv) - 1:
            num_players = int(sys.argv[i + 2])
    
    for i in range(20):
        game = AvalonGame(num_players=num_players)
        game_state = game.play_game()
    
        output_dir = os.path.dirname(os.path.abspath(__file__))
        game_dir = os.path.join(output_dir, "individual_games_new", f"{num_players}")
        os.makedirs(game_dir, exist_ok=True)
        output_file = os.path.join(game_dir, f"game_{i:02d}.json")
        game.save_game(game_state, output_file)
    
    print(f"\n{'='*60}")
    print("DATASET GENERATION COMPLETE!")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

