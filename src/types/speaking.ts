/**
 * Speaking Roleplay Types
 * API endpoint: GET /api/v1/speaking/roleplay/scenarios
 */

export type Difficulty = "BAND_5" | "BAND_6" | "BAND_7" | "BAND_8";
export type IeltsPart = "PART_1" | "PART_2" | "PART_3" | "PART_4" | "SITUATIONAL";

export interface RoleplayScenario {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  ielts_part: IeltsPart;
  context: string;
  user_role: string;
  agent_role: string;
  opening_prompt: string;
  target_vocabulary: string[];
  target_grammar: string[];
  suggested_topics: string[];
  duration_min: number;
  turn_count_target: number;
}

export interface RoleplayScenariosResponse {
  scenarios: RoleplayScenario[];
  total: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  audio_url?: string;
}

export interface RoleplaySession {
  id: string;
  scenario_id: string;
  scenario: RoleplayScenario;
  messages: ChatMessage[];
  current_turn: number;
  status: "active" | "completed" | "abandoned";
  started_at: Date;
  ended_at?: Date;
  vocabulary_noted: string[];
  errors_flagged: string[];
}

export interface RoleplayTurnRequest {
  session_id: string;
  user_input: string;
}

export interface RoleplayTurnResponse {
  session_id: string;
  agent_message: string;
  current_turn: number;
  suggested_topics: string[];
  vocabulary_to_note: string[];
  is_complete: boolean;
  feedback?: string;
}

export interface RoleplayStartRequest {
  scenario_id: string;
}

export interface RoleplayStartResponse {
  session_id: string;
  scenario: RoleplayScenario;
  opening_message: string;
  current_turn: number;
}

export interface RoleplayEndResponse {
  session_id: string;
  summary: string;
  vocabulary_used: string[];
  grammar_focus: string[];
  overall_feedback: string;
  suggested_improvements: string[];
}
