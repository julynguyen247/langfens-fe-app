import { create } from "zustand";

type LoadingState = {
  isLoading: boolean;
  setLoading: (val: boolean) => void;
};

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  setLoading: (val) => set({ isLoading: val }),
}));
