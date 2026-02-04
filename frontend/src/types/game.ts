export interface Player {
  name: string;
  role: string;
  is_good: boolean;
  special_knowledge: string[];
}

export interface Message {
  player: string;
  content: string;
  timestamp: number;
  global_turn_id: number;
  phase: string;
  thinking_time: number;
  reasoning_content?: string | null;
}

export interface Vote {
  player: string;
  vote: "approve" | "reject";
  comment: string;
  thinking_time: number;
  reasoning_content?: string | null;
}

export interface Proposal {
  proposal_id: number;
  leader: string;
  team_members: string[];
  reasoning: string;
  thinking_time: number;
  reasoning_content?: string | null;
  votes: Vote[];
  vote_result: "approved" | "rejected";
}

export interface MissionAction {
  player: string;
  action: "success" | "fail";
}

export interface Mission {
  mission_number: number;
  proposals: Proposal[];
  final_team_index: number;
  discussion: Message[];
  quest_actions: MissionAction[] | null;
  mission_result: "success" | "fail" | null;
  fail_count: number | null;
}

export interface AssassinPhase {
  assassin: string;
  evil_discussion: Message[];
  guess: string;
  reasoning: string;
  correct: boolean;
  thinking_time: number;
  reasoning_content?: string | null;
}

export interface GameConfig {
  model: string;
  reasoning_effort: string;
  mission_team_sizes: number[];
  num_messages_per_player: number;
  num_players: number;
}

export interface Game {
  game_id: string;
  config: GameConfig;
  players: Player[];
  missions: Mission[];
  winner: "good" | "evil";
  assassin_phase: AssassinPhase | null;
}

export interface GameListItem {
  id: string;
  path: string;
  players: number;
  winner: "good" | "evil";
  source: string;
}

export interface TournamentInfo {
  name: string;
  path: string;
  players: number;
  games: number;
  reasoning: string;
  hasMemory: boolean;
}
