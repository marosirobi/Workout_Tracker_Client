import type { AuthUser } from "@/store/authStore";
import { axiosClient } from "./axiosClient";

interface LoginResult {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResult> => {
    const response = await axiosClient.post("/auth/login", {
      email,
      password,
    });

    const { token, refreshToken, user } = response.data;

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bodyWeightKg: user.bodyWeightKg ?? null,
      },
      token,
      refreshToken,
    };
  },

  register: async (username: string, email: string, password: string) => {
    const response = await axiosClient.post("/auth/register", {
      username,
      email,
      password,
    });

    return response.data;
  },

  logout: async (refreshToken: string) => {
    await axiosClient.post("/auth/logout", { refreshToken });
  },
};
