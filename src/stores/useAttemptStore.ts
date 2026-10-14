"use client";
import { create } from "zustand";

export type AttemptOption = {
  id: string;
  idx: number;
  contentMd: string;
};

export type FlowChartNode = {
  key: string;
  label: string;
};

export type AttemptQuestion = {
  id: string;
  idx: number;
  type: string;
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  difficulty: number;
  promptMd: string;
  explanationMd?: string;
  options?: AttemptOption[];
  flowChartNodes?: FlowChartNode[];
};

export type AttemptQuestionGroup = {
  id: string;
  idx: number;
  startIdx: number;
  endIdx: number;
  instructionMd: string;
  questions: AttemptQuestion[];
};

export type AttemptSection = {
  id: string;
  idx: number;
  title: string;
  instructionsMd: string;
  passageMd: string;
  audioUrl?: string;
  transcriptMd?: string;
  questionGroups: AttemptQuestionGroup[]; // Questions are only inside groups now
};

export type AttemptStartData = {
  attemptId: string;
  paper: {
    id: string;
    slug: string;
    title: string;
    descriptionMd: string;
    category: string;
    level: string;
    durationMin: number;
    imageUrl?: string;
    sections: AttemptSection[];
  };
  startedAt: string;
  durationSec: number;
  timeLeft: number;
};

type State = {
  byId: Record<string, AttemptStartData>;
  isSubmitting: boolean;
  setAttempt: (data: AttemptStartData) => void;
  setIsSubmitting: (submitting: boolean) => void;
  getAttempt: (id: string) => AttemptStartData | undefined;
  clear: (id?: string) => void;
  // Per-attempt submit handler so the layout's Submit button can flush the
  // latest in-memory answers (autosave is 2s-debounced; without this the
  // layout would call `submitAttempt(attemptId)` with no answers and lose
  // anything the user typed in the last 2 seconds).
  submitHandlers: Record<string, (() => Promise<void>) | undefined>;
  setSubmitHandler: (
    id: string,
    handler: (() => Promise<void>) | undefined
  ) => void;
};

function loadAllFromSession(): Record<string, AttemptStartData> {
  if (typeof window === "undefined") return {};
  const out: Record<string, AttemptStartData> = {};

  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (!k || !k.startsWith("attempt:")) continue;

      const raw = sessionStorage.getItem(k);
      if (!raw) continue;

      try {
        const data = JSON.parse(raw) as AttemptStartData;
        if (data?.attemptId) out[data.attemptId] = data;
      } catch {}
    }
  } catch {}

  return out;
}

function readOneFromSession(id: string): AttemptStartData | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(`attempt:${id}`);
    if (!raw) return undefined;
    const data = JSON.parse(raw) as AttemptStartData;
    if (!data?.attemptId) return undefined;
    return data;
  } catch {
    return undefined;
  }
}

export const useAttemptStore = create<State>((set, get) => ({
  byId: loadAllFromSession(),
  isSubmitting: false,
  submitHandlers: {},

  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),

  setSubmitHandler: (id, handler) =>
    set((s) => {
      if (!id) return s;
      const next = { ...s.submitHandlers };
      if (handler) next[id] = handler;
      else delete next[id];
      return { submitHandlers: next };
    }),

  setAttempt: (data) =>
    set((s) => {
      const attemptId = data?.attemptId;
      if (!attemptId) return s;

      const next = { ...s.byId, [attemptId]: data };

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`attempt:${attemptId}`, JSON.stringify(data));
        } catch {}
      }

      return { byId: next };
    }),

  getAttempt: (id) => {
    const inMem = get().byId[id];
    if (inMem) return inMem;

    const fromSession = readOneFromSession(id);
    if (!fromSession) return undefined;

    set((s) => ({ byId: { ...s.byId, [fromSession.attemptId]: fromSession } }));
    return fromSession;
  },

  clear: (id) =>
    set((s) => {
      if (!id) {
        if (typeof window !== "undefined") {
          try {
            const keys: string[] = [];
            for (let i = 0; i < sessionStorage.length; i++) {
              const k = sessionStorage.key(i);
              if (k && k.startsWith("attempt:")) keys.push(k);
            }
            for (const k of keys) sessionStorage.removeItem(k);
          } catch {}
        }
        return { byId: {}, submitHandlers: {} };
      }

      const next = { ...s.byId };
      delete next[id];

      const nextHandlers = { ...s.submitHandlers };
      delete nextHandlers[id];

      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`attempt:${id}`);
        } catch {}
      }

      return { byId: next, submitHandlers: nextHandlers };
    }),
}));
