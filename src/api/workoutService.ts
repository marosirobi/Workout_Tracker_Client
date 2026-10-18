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
  movingTimeSeconds: number | null;
}

export interface ExerciseSetDetail {
  id: number;
  setNumber: number;
  reps: number;
  weight: number;
}

export interface WorkoutExerciseDetail {
  id: number;
  exerciseId: number;
  exerciseName: string;
  orderIndex: number;
  sets: ExerciseSetDetail[];
}

export interface WorkoutDetailResponse {
  id: number;
  workoutTitle: string;
  workoutNote: string | null;
  type: "STRENGTH" | "CARDIO";
  startTime: string;
  endTime: string;
  exercises?: WorkoutDetailResponse[];
  cardioStats?: {
    totalDistance: number;
    avgPace: string;
    movingTimeSeconds: number;
    elevationGain: number;
  } | null;
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

export interface CardioDataRequest {
  workoutTitle: string;
  workoutNote?: string;
  endTime: string;
  stats: {
    totalDistance: number;
    avgPace: number;
    movingTimeSeconds: number;
    elevationGain: number;
  };
  trackPoints: any[];
}

export interface UpdateWorkoutRequest {
  workoutTitle: string;
  workoutNote?: string;
  endTime: string;
  exercises: any[];
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

  getWorkoutById: async (id: number): Promise<WorkoutDetailResponse> => {
    const response = await axiosClient.get(`/workouts/${id}`);
    return response.data;
  },

  deleteWorkout: async (id: number) => {
    await axiosClient.delete(`/workouts/${id}`);
  },

  createWorkout: async (
    request: CreateWorkoutRequest,
  ): Promise<WorkoutResponse> => {
    const response = await axiosClient.post("/workouts", request);
    return response.data;
  },

  updateWorkout: async (id: number, request: any): Promise<WorkoutResponse> => {
    const response = await axiosClient.put(`/workouts/${id}`, request);
    return response.data;
  },

  saveCardioData: async (
    id: number,
    request: CardioDataRequest,
  ): Promise<WorkoutResponse> => {
    const response = await axiosClient.post(
      `/workouts/${id}/cardio-data`,
      request,
    );
    return response.data;
  },
};
