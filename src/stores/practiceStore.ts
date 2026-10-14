import { create } from "zustand";

export type PracticeFilter = { groupId?: string; itemId?: string };
type Tab = "todo" | "done";

type PracticeState = {
  filter: PracticeFilter;
  tab: Tab;
  query: string;
  setFilter: (f: PracticeFilter) => void;
  setFilterIds: (groupId: string, itemId: string) => void; // helper
  setTab: (t: Tab) => void;
  setQuery: (q: string) => void;
};

export const usePracticeStore = create<PracticeState>()((set) => ({
  filter: {},
  tab: "todo",
  query: "",
  setFilter: (f) => set({ filter: f }),
  setFilterIds: (groupId, itemId) => set({ filter: { groupId, itemId } }),
  setTab: (t) => set({ tab: t }),
  setQuery: (q) => set({ query: q }),
}));
