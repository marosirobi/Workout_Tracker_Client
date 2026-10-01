import { create } from "zustand";

interface User {
  id: number;
  username: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,

  setUser: (user: User) => set({ user: user, isLoggedIn: true }),

  clearAuth: () => set({ user: null, isLoggedIn: false }),
}));
