"use client";
import { create } from "zustand";

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
    sections: {
      id: string;
      idx: number;
      title: string;
      instructionsMd: string;
      questions: {
        id: string;
        idx: number;
        type: string;
        skill: string;
        difficulty: number;
        promptMd: string;
        explanationMd: string;
        options: { id: string; idx: number; contentMd: string }[];
      }[];
    }[];
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
      if (typeof window !== "undefined")
        sessionStorage.setItem(
          `attempt:${data.attemptId}`,
          JSON.stringify(data)
        );
      return { byId: next };
    }),
  getAttempt: (id) => get().byId[id],
  clear: (id) =>
    set((s) => {
      if (!id) return { byId: {} };
      const next = { ...s.byId };
      delete next[id];
      if (typeof window !== "undefined")
        sessionStorage.removeItem(`attempt:${id}`);
      return { byId: next };
    }),
}));
