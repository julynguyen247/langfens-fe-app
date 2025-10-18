import { create } from "zustand";

export type User = {
  email: string;
  name: string;
  id: string;
};

type UserStore = {
  user: User | null;
  setUser: (u: User) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (u: User) => set({ user: u }),
}));
