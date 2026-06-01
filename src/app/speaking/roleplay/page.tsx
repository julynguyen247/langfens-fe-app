"use client";

import {
  getRoleplayScenarios,
  startRoleplaySession,
  sendRoleplayTurnWithSpeech,
  sendRoleplayTurnAudio,
  type RoleplayScenario,
  type RoleplayTurnMessage,
  type RoleplayFeedback,
  type RoleplayTurnWithSpeechResponse,
} from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AudioRecorderBar from "./AudioRecorderBar";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const difficultyClass: Record<RoleplayScenario["difficulty"], string> = {
  BEGINNER: "bg-emerald-100 text-emerald-800",
  INTERMEDIATE: "bg-amber-100 text-amber-800",
  ADVANCED: "bg-rose-100 text-rose-800",
};

function unwrapData<T>(payload: any): T {
  return (payload?.data ?? payload) as T;
}

function turnToChatMessage(turn: RoleplayTurnMessage): ChatMessage {
  return {
    id: `${turn.speaker}-${turn.turn_index}-${turn.timestamp}`,
    role: turn.speaker === "agent" ? "assistant" : "user",
    text: turn.text,
  };
}

export default function SpeakingRoleplayPage() {
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [scenarioError, setScenarioError] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [startingSession, setStartingSession] = useState(false);
  const [sendingTurn, setSendingTurn] = useState(false);

  // Latest evaluation feedback from speaking flow
  const [latestFeedback, setLatestFeedback] = useState<{
    pronunciation_score?: number;
    pronunciation_mode?: "acoustic" | "heuristic" | "none";
    content_score?: number;
    grammar_score?: number;
    fluency_score?: number;
    lexical_score?: number;
    overall_speaking_band?: number;
    feedback?: RoleplayFeedback;
  } | null>(null);

  const userId = useUserStore((state) => state.user?.id) ?? "demo-user";

  useEffect(() => {
    let mounted = true;

    const loadScenarios = async () => {
      try {
        setLoadingScenarios(true);
        const res = await getRoleplayScenarios();
        const payload = (res.data?.scenarios ? res.data : res.data?.data) ?? {};
        const list = Array.isArray(payload.scenarios) ? payload.scenarios : [];
        if (!mounted) return;
        setScenarios(list);
        setSelectedScenario(list[0] ?? null);
      } catch {
        if (!mounted) return;
        setScenarioError("Could not load scenarios from API.");
      } finally {
        if (mounted) setLoadingScenarios(false);
      }
    };

    loadScenarios();
    return () => {
      mounted = false;
    };
  }, []);

  const bootstrapSession = async (scenario: RoleplayScenario) => {
    setStartingSession(true);
    setSessionError("");
    setLatestFeedback(null);
    try {
      const response = await startRoleplaySession({
        user_id: userId,
        scenario_slug: scenario.slug,
      });
      const body = unwrapData<{
        session_id: string;
        agent_message: RoleplayTurnMessage;
      }>(response.data);
      setSessionId(body.session_id);
      setMessages([turnToChatMessage(body.agent_message)]);
    } catch {
      setSessionId("");
      setMessages([
        {
          id: `intro-${scenario.slug}`,
          role: "assistant",
          text: scenario.opening_prompt,
        },
      ]);
      setSessionError("Could not start roleplay session.");
    } finally {
      setStartingSession(false);
    }
  };

  useEffect(() => {
    if (!selectedScenario) {
      setSessionId("");
      setMessages([]);
      return;
    }

    void bootstrapSession(selectedScenario);
  }, [selectedScenario?.slug, userId]);

  const turns = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages]
  );

  // Text Submit turn using turn-with-speech for feedback
  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !selectedScenario || !sessionId || sendingTurn || startingSession) return;

    setDraft("");
    setSendingTurn(true);
    setSessionError("");

    try {
      const response = await sendRoleplayTurnWithSpeech({
        session_id: sessionId,
        user_id: userId,
        text: text,
      });
      const body = unwrapData<RoleplayTurnWithSpeechResponse>(response.data);
      setMessages((current) => [
        ...current,
        turnToChatMessage(body.user_message),
        turnToChatMessage(body.agent_message),
      ]);

      setLatestFeedback({
        pronunciation_score: body.pronunciation_score,
        pronunciation_mode: body.pronunciation_mode,
        content_score: body.content_score,
        grammar_score: body.grammar_score,
        fluency_score: body.fluency_score,
        lexical_score: body.lexical_score,
        overall_speaking_band: body.overall_speaking_band,
        feedback: body.feedback,
      });
    } catch {
      setDraft(text);
      setSessionError("Could not send this turn. Please try again.");
    } finally {
      setSendingTurn(false);
    }
  };

  // Audio Submit turn using turn-audio for acoustic scoring + feedback
  const handleSendAudio = async (audioFile: File) => {
    if (!selectedScenario || !sessionId || sendingTurn || startingSession) return;
    setSendingTurn(true);
    setSessionError("");

    try {
      const response = await sendRoleplayTurnAudio({
        sessionId,
        userId,
        audio: audioFile,
      });
      const body = unwrapData<RoleplayTurnWithSpeechResponse>(response.data);
      setMessages((current) => [
        ...current,
        turnToChatMessage(body.user_message),
        turnToChatMessage(body.agent_message),
      ]);

      setLatestFeedback({
        pronunciation_score: body.pronunciation_score,
        pronunciation_mode: body.pronunciation_mode,
        content_score: body.content_score,
        grammar_score: body.grammar_score,
        fluency_score: body.fluency_score,
        lexical_score: body.lexical_score,
        overall_speaking_band: body.overall_speaking_band,
        feedback: body.feedback,
      });
    } catch (exc) {
      console.error("Failed to send audio turn:", exc);
      setSessionError("Could not submit your voice recording. Please try again.");
    } finally {
      setSendingTurn(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-black text-slate-900">Speaking Roleplay</h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        Record your voice to get high-fidelity acoustic pronunciation feedback, accent analysis, and estimated IELTS bands powered by your local Wav2Vec2 model.
      </p>

      <section className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.6fr_1.1fr]">
        {/* Column 1: Scenarios Selector */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 h-fit">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif text-xl font-bold text-slate-900">Scenarios</h2>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{scenarios.length} total</span>
          </div>

          {loadingScenarios && <p className="mt-4 text-sm text-slate-500">Loading scenarios...</p>}
          {scenarioError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{scenarioError}</p>}

          <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {scenarios.map((scenario) => {
              const active = scenario.slug === selectedScenario?.slug;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${active
                      ? "border-[#3B82F6] bg-[#EFF6FF]"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{scenario.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${difficultyClass[scenario.difficulty]}`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{scenario.ielts_part.replace("_", " ")}</p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Column 2: Chat log */}
        <article className="flex min-h-[560px] flex-col rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-serif text-xl font-bold text-slate-900">Roleplay Chat</h2>
            <p className="mt-1 text-sm text-slate-600">
              {selectedScenario?.context ?? "Select a scenario to begin."}
            </p>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Turn {turns} / {selectedScenario?.turn_count_target ?? 0}
              </span>
              {latestFeedback?.pronunciation_mode && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${latestFeedback.pronunciation_mode === "acoustic"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                  {latestFeedback.pronunciation_mode === "acoustic" ? "⚡ Acoustic Grader" : "🕒 Heuristic Grader"}
                </span>
              )}
            </div>
            {startingSession && <p className="mt-2 text-xs text-slate-500">Starting session...</p>}
            {sessionError && <p className="mt-2 text-xs text-red-600">{sessionError}</p>}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 max-h-[450px]">
            {messages.map((message) => (
              <MessageBubble key={message.id} role={message.role} text={message.text} />
            ))}
            {sendingTurn && (
              <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:220ms]" />
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50/50 rounded-b-2xl">
            <AudioRecorderBar
              disabled={!selectedScenario || !sessionId || sendingTurn || startingSession}
              onTranscript={(transcript) => setDraft(transcript)}
              onSendAudio={handleSendAudio}
            />
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type your response or send audio..."
                className="h-11 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none bg-white transition focus:border-[#3B82F6]"
                disabled={!selectedScenario || !sessionId || sendingTurn || startingSession}
              />
              <button
                type="submit"
                disabled={!selectedScenario || !sessionId || !draft.trim() || sendingTurn || startingSession}
                className="h-11 rounded-xl bg-[#2563EB] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {sendingTurn ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </article>

        {/* Column 3: Speaking Performance & Feedback */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 h-fit">
          <h2 className="font-serif text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">IELTS Speaking Score</h2>

          {!latestFeedback ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                🎤
              </div>
              <p className="text-xs text-slate-500 font-medium px-4 leading-relaxed">
                Send a message or audio recording to get detailed feedback and score breakdown.
              </p>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Score Circular Badge */}
              <div className="flex flex-col items-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#60A5FA] text-white shadow-md">
                  <div className="text-center">
                    <span className="text-[28px] font-black tracking-tight">
                      {latestFeedback.overall_speaking_band?.toFixed(1) ?? "-"}
                    </span>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 -mt-1">Band</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500 font-medium">Estimated Overall Speaking Score</p>
              </div>

              {/* Sub-Scores (IELTS Criteria 1 - 9) */}
              <div className="space-y-3.5">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">Criteria Breakdown</h3>

                {/* Pronunciation */}
                <ScoreProgress
                  label="Pronunciation"
                  score={latestFeedback.pronunciation_score}
                  icon="🗣️"
                />

                {/* Fluency & Coherence */}
                <ScoreProgress
                  label="Fluency & Coherence"
                  score={latestFeedback.fluency_score}
                  icon="🌊"
                />

                {/* Lexical Resource */}
                <ScoreProgress
                  label="Lexical Resource"
                  score={latestFeedback.lexical_score}
                  icon="📚"
                />

                {/* Grammatical Range */}
                <ScoreProgress
                  label="Grammatical Range"
                  score={latestFeedback.grammar_score}
                  icon="🔧"
                />

                {/* Content Relevance */}
                <ScoreProgress
                  label="Content Relevance"
                  score={latestFeedback.content_score}
                  icon="🎯"
                />
              </div>

              {/* Coaching Tips */}
              {latestFeedback.feedback && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">Evaluator Insights</h3>

                  {latestFeedback.feedback.pronunciation && (
                    <FeedbackTipSection
                      title="Pronunciation Tip"
                      text={latestFeedback.feedback.pronunciation}
                      colorClass="text-blue-800 bg-blue-50 border-blue-100"
                    />
                  )}

                  {latestFeedback.feedback.grammar && (
                    <FeedbackTipSection
                      title="Grammar Check"
                      text={latestFeedback.feedback.grammar}
                      colorClass="text-purple-800 bg-purple-50 border-purple-100"
                    />
                  )}

                  {latestFeedback.feedback.lexical && (
                    <FeedbackTipSection
                      title="Lexical Tip"
                      text={latestFeedback.feedback.lexical}
                      colorClass="text-emerald-800 bg-emerald-50 border-emerald-100"
                    />
                  )}

                  {latestFeedback.feedback.fluency && (
                    <FeedbackTipSection
                      title="Fluency Tip"
                      text={latestFeedback.feedback.fluency}
                      colorClass="text-sky-800 bg-sky-50 border-sky-100"
                    />
                  )}

                  {latestFeedback.feedback.content && (
                    <FeedbackTipSection
                      title="Content Relevance"
                      text={latestFeedback.feedback.content}
                      colorClass="text-orange-800 bg-orange-50 border-orange-100"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function MessageBubble({ role, text }: { role: ChatMessage["role"]; text: string }) {
  const user = role === "user";
  return (
    <div className={`flex ${user ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${user
            ? "rounded-br-md bg-[#2563EB] text-white"
            : "rounded-bl-md bg-slate-100 text-slate-800"
          }`}
      >
        {text}
      </div>
    </div>
  );
}

function ScoreProgress({ label, score, icon }: { label: string; score?: number; icon: string }) {
  // Convert 0.0 - 1.0 back to 0.0 - 9.0 for IELTS display
  const finalScore = score !== undefined ? score * 9 : null;
  const percentage = score !== undefined ? score * 100 : 0;

  // Choose progress bar color based on score range
  const getBarColor = (s?: number) => {
    if (!s) return "bg-slate-300";
    if (s >= 0.75) return "bg-emerald-500"; // Band 6.75+ (High)
    if (s >= 0.55) return "bg-blue-500";    // Band 5.0+ (Average)
    return "bg-amber-500";                  // Low
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span>{label}</span>
        </span>
        <span>{finalScore !== null ? finalScore.toFixed(1) : "-"}</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getBarColor(score)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FeedbackTipSection({ title, text, colorClass }: { title: string; text: string; colorClass: string }) {
  return (
    <div className={`p-3 rounded-xl border text-xs leading-relaxed ${colorClass}`}>
      <span className="font-bold block mb-0.5">{title}</span>
      {text}
    </div>
  );
}
