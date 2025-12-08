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

export const useAttemptStore = create<State>((set, get) => ({
  byId: {},
  setAttempt: (data) =>
    set((s) => {
      const next = { ...s.byId, [data.attemptId]: data };
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `attempt:${data.attemptId}`,
          JSON.stringify(data)
        );
      }
      return { byId: next };
    }),
  getAttempt: (id) => get().byId[id],
  clear: (id) =>
    set((s) => {
      if (!id) return { byId: {} };
      const next = { ...s.byId };
      delete next[id];
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`attempt:${id}`);
      }
      return { byId: next };
    }),
}));
