import { WorkoutType } from "@/store/workoutStore";
import { MuscleGroup } from "@/utils/muscleGroups";
import { axiosClient } from "./axiosClient";

export interface WorkoutSummary {
  id: number;
  name: string;
  type: "STRENGTH" | "CARDIO";
  startTime: string;
  endTime: string;
  durationSeconds: number | null;

  totalDistance: number | null;
  avgPace: string | null;
  movingTimeSeconds: number | null;

  totalVolume: number | null;
  totalSets: number | null;
  exerciseCount: number | null;
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
  muscleGroup: MuscleGroup | null;
  weightRank: number | null;
  sets: ExerciseSetDetail[];
}

export interface EditWorkoutSetRequest {
  setNumber: number;
  weight: number;
  reps: number;
}

export interface EditWorkoutExerciseRequest {
  exerciseId: number;
  orderIndex: number;
  sets: EditWorkoutSetRequest[];
}

export interface CardioStatsResponse {
  totalDistance: number;
  avgPace: string;
  movingTimeSeconds: number;
  elevationGain: number;
}

export interface TrackPointResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  speed: number;
  timestamp: string;
  segment: number;
}

export interface BestEffortResponse {
  distanceMeters: number;
  durationSeconds: number;
  startOffsetMeters: number;
  rank: number;
}

export interface WorkoutDetailResponse {
  id: number;
  workoutTitle: string;
  workoutNote: string | null;
  type: "STRENGTH" | "CARDIO";
  startTime: string;
  endTime: string | null;
  exercises?: WorkoutExerciseDetail[];
  cardioStats?: CardioStatsResponse | null;
  trackPoints?: TrackPointResponse[];
  bestEfforts?: BestEffortResponse[];
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
  exercises?: WorkoutExerciseDetail[];
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

export interface EditWorkoutRequest {
  workoutTitle: string;
  workoutNote: string;
  exercises?: EditWorkoutExerciseRequest[];
}

export const workoutService = {
  getUserWorkouts: async (
    page: number = 0,
    size: number = 10,
    type?: WorkoutType,
  ): Promise<PageResponse<WorkoutSummary>> => {
    const response = await axiosClient.get("/workouts", {
      params: { page, size, type },
    });
    return response.data;
  },

  getWorkoutById: async (id: number): Promise<WorkoutDetailResponse> => {
    const response = await axiosClient.get(`/workouts/${id}`);
    return response.data;
  },

  deleteWorkout: async (id: number): Promise<void> => {
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

  editWorkout: async (
    id: number,
    request: EditWorkoutRequest,
  ): Promise<WorkoutDetailResponse> => {
    const response = await axiosClient.put(`/workouts/${id}/edit`, request);
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
