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

export type AttemptSection = {
  id: string;
  idx: number;
  title: string;
  instructionsMd: string;
  passageMd: string;
  audioUrl?: string;
  transcriptMd?: string;
  questions: AttemptQuestion[];
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
  setAttempt: (data: AttemptStartData) => void;
  getAttempt: (id: string) => AttemptStartData | undefined;
  clear: (id?: string) => void;
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
        return { byId: {} };
      }

      const next = { ...s.byId };
      delete next[id];

      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`attempt:${id}`);
        } catch {}
      }

      return { byId: next };
    }),
}));
