import { axiosClient } from "./axiosClient";

export interface WorkoutSummary {
  id: number;
  name: string;
  type: "STRENGTH" | "CARDIO";
  startTime: string;
  endTime: string;
  totalDistance: number | null;
  avgPace: string | null;
  durationSeconds: number | null;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface CreateWorkoutRequest {
  type: "STRENGTH" | "CARDIO";
  startTime: string;
  templateId?: number | null;
}

export interface WorkoutResponse {
  id: number;
  type: "STRENGTH" | "CARDIO";
  startTime: string;
  templateId?: number | null;
}

export const workoutService = {
  getUserWorkouts: async (
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<WorkoutSummary>> => {
    const response = await axiosClient.get("/workouts", {
      params: { page, size },
    });
    return response.data;
  },

  createWorkout: async (
    request: CreateWorkoutRequest,
  ): Promise<WorkoutResponse> => {
    const response = await axiosClient.post("/workouts", request);
    return response.data;
  },
};
