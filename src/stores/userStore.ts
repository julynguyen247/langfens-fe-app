import { create } from "zustand";

export type User = {
  email: string;
  emailConfirmed: boolean;
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
