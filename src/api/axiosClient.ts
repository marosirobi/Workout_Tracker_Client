import { useAuthStore } from "@/store/authStore";
import { logger } from "@/utils/logger";
import axios from "axios";

const BASE_URL = "http://192.168.1.243:8081/api";

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) {
    throw new Error("Nincs frissítő token");
  }

  const response = await axios.post(`${BASE_URL}/auth/refresh`, {
    refreshToken,
  });

  const newToken: string = response.data.token;
  setTokens(newToken, response.data.refreshToken);
  return newToken;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRequest = originalRequest?.url?.includes("/auth/");

    const shouldRefresh =
      (status === 401 || status === 403) &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest;

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      logger.warn("A munkamenet lejárt, újra be kell jelentkezni");
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    }
  },
);
