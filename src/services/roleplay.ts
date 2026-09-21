import { apisAi } from "../utils/api.customize";

export type RoleplayScenario = {
  id: string;
  slug: string;
  title: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  ielts_part: "PART_1" | "PART_2" | "PART_3" | "SITUATIONAL";
  context: string;
  user_role: string;
  agent_role: string;
  opening_prompt: string;
  target_vocabulary: string[];
  target_grammar: string[];
  suggested_topics: string[];
  duration_min: number;
  turn_count_target: number;
};

export type RoleplayTurnMessage = {
  speaker: "user" | "agent";
  text: string;
  turn_index: number;
  timestamp: string;
};

export type RoleplayStartPayload = {
  user_id: string;
  scenario_slug: string;
};

export type RoleplayStartResponse = {
  session_id: string;
  user_id: string;
  scenario: RoleplayScenario;
  agent_message: RoleplayTurnMessage;
};

export type RoleplayTurnPayload = {
  session_id: string;
  user_id: string;
  utterance: string;
};

export type RoleplayTurnResponse = {
  session_id: string;
  scenario_slug: string;
  user_message: RoleplayTurnMessage;
  agent_message: RoleplayTurnMessage;
  turn_count: number;
};

export async function getRoleplayScenarios() {
  const res = await apisAi.get("/api/v1/speaking/roleplay/scenarios");
  return res;
}

export async function startRoleplaySession(payload: RoleplayStartPayload) {
  const res = await apisAi.post("/api/v1/speaking/roleplay/start", payload);
  return res;
}

export async function sendRoleplayTurn(payload: RoleplayTurnPayload) {
  const res = await apisAi.post("/api/v1/speaking/roleplay/turn", payload);
  return res;
}

export type RoleplayFeedback = {
  content?: string;
  grammar?: string;
  lexical?: string;
  fluency?: string;
  pronunciation?: string;
};

export type RoleplayTurnWithSpeechPayload = {
  session_id: string;
  user_id: string;
  text: string;
  errors?: Array<{ word: string; type: "missing" | "incorrect" }>;
  score?: number;
};

export type RoleplayTurnWithSpeechResponse = {
  session_id: string;
  scenario_slug: string;
  user_message: RoleplayTurnMessage;
  agent_message: RoleplayTurnMessage;
  turn_count: number;
  feedback: RoleplayFeedback;
  pronunciation_score?: number;
  pronunciation_mode?: "acoustic" | "heuristic" | "none";
  content_score?: number;
  grammar_score?: number;
  fluency_score?: number;
  lexical_score?: number;
  off_topic?: boolean;
  overall_speaking_band?: number;
};

export async function sendRoleplayTurnWithSpeech(payload: RoleplayTurnWithSpeechPayload) {
  const res = await apisAi.post<RoleplayTurnWithSpeechResponse>(
    "/api/v1/speaking/roleplay/turn-with-speech",
    payload
  );
  return res;
}

export async function sendRoleplayTurnAudio(params: {
  sessionId: string;
  userId: string;
  audio: Blob | File;
}) {
  const { sessionId, userId, audio } = params;
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("user_id", userId);

  const filename = audio instanceof File ? audio.name : `speaking-${Date.now()}.wav`;
  formData.append("audio", audio, filename);

  const res = await apisAi.post<RoleplayTurnWithSpeechResponse>(
    "/api/v1/speaking/roleplay/turn-audio",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res;
}
