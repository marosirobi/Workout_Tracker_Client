import * as SecureStore from "expo-secure-store";
import { axiosClient } from "./axiosClient";

export const authService = {
  login: async (email: string, password: string) => {
    const response = await axiosClient.post("/auth/login", {
      email: email,
      password: password,
    });

    const { token, refreshToken, user } = response.data;

    await SecureStore.setItemAsync("accessToken", token);
    await SecureStore.setItemAsync("refreshToken", refreshToken);

    return user;
  },

  register: async (username: string, email: string, password: string) => {
    const response = await axiosClient.post("auth/register", {
      username: username,
      email: email,
      password: password,
    });

    return response.data;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
  },
};
