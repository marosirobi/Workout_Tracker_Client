import type { AuthUser } from "@/store/authStore";
import { axiosClient } from "./axiosClient";

interface LoginResult {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

function toLoginResult(data: any): LoginResult {
  const { token, refreshToken, user } = data;
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
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResult> => {
    const response = await axiosClient.post("/auth/login", {
      email,
      password,
    });
    return toLoginResult(response.data);
  },

  register: async (
    username: string,
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    const response = await axiosClient.post("/auth/register", {
      username,
      email,
      password,
    });
    return toLoginResult(response.data);
  },

  logout: async (refreshToken: string) => {
    await axiosClient.post("/auth/logout", { refreshToken });
  },
};
