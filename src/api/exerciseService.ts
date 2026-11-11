import { MuscleGroup } from "@/utils/muscleGroups";
import type { TrackingType } from "@/utils/trackingTypes";
import { axiosClient } from "./axiosClient";

export interface Exercise {
  id: number;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  trackingType: TrackingType | null;
}

export interface ExerciseRecord {
  value: number;
  date: string;
  workoutId: number;
}

export interface ExerciseSessionStat {
  workoutId: number;
  startTime: string;
  maxWeight: number | null;
  bestOneRepMax: number | null;
  bestSetVolume: number | null;
  bestSessionVolume: number | null;
  maxReps: number | null;
  maxDurationSeconds: number | null;
}

export interface ExerciseStats {
  exerciseId: number;
  muscleGroup: MuscleGroup;
  exerciseName: string;
  trackingType: TrackingType | null;
  heaviestWeight: ExerciseRecord | null;
  bestOneRepMax: ExerciseRecord | null;
  bestSetVolume: ExerciseRecord | null;
  bestSessionVolume: ExerciseRecord | null;
  mostReps: ExerciseRecord | null;
  longestDuration: ExerciseRecord | null;
  history: ExerciseSessionStat[];
}

export const exerciseService = {
  getAllExercises: async (): Promise<Exercise[]> => {
    const response = await axiosClient.get("/exercises");
    return response.data;
  },

  getExerciseStats: async (id: number): Promise<ExerciseStats> => {
    const response = await axiosClient.get(`/exercises/${id}/stats`);
    return response.data;
  },
};
