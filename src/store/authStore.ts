import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  bodyWeightKg?: number | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  setAuth: (user: AuthUser, token: string, refreshToken: string) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  updateUser: (changes: Partial<AuthUser>) => void;
  clearAuth: () => void;
}

const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoggedIn: false,

      setAuth: (user, token, refreshToken) =>
        set({ user, token, refreshToken, isLoggedIn: true }),

      setTokens: (token, refreshToken) =>
        set((state) => ({
          token,
          refreshToken: refreshToken ?? state.refreshToken,
        })),

      updateUser: (changes) =>
        set((state) =>
          state.user ? { user: { ...state.user, ...changes } } : state,
        ),

      clearAuth: () =>
        set({ user: null, token: null, refreshToken: null, isLoggedIn: false }),
    }),
    {
      name: "auth-secure-storage",
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
