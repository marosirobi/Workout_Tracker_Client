import { axiosClient } from "./axiosClient";

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  bodyWeightKg: number | null;
  createdAt: string;
  accessToken?: string | null;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  bodyWeightKg: number | null;
}

export const userService = {
  getMe: async (): Promise<UserResponse> => {
    const response = await axiosClient.get("/users/me");
    return response.data;
  },

  updateMe: async (request: UpdateUserRequest): Promise<UserResponse> => {
    const response = await axiosClient.put("/users/me", request);
    return response.data;
  },
};
