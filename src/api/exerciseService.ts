import { MuscleGroup } from "@/utils/muscleGroups";
import { axiosClient } from "./axiosClient";

export interface Exercise {
  id: number;
  exerciseName: string;
  muscleGroup: MuscleGroup;
}

export interface ExerciseRecord {
  value: number;
  date: string;
  workoutId: number;
}

export interface ExerciseSessionStat {
  workoutId: number;
  startTime: string;
  maxWeight: number;
  bestOneRepMax: number;
  bestSetVolume: number;
  bestSessionVolume: number;
}

export interface ExerciseStats {
  exerciseId: number;
  muscleGroup: MuscleGroup;
  exerciseName: string;
  heaviestWeight: ExerciseRecord | null;
  bestOneRepMax: ExerciseRecord | null;
  bestSetVolume: ExerciseRecord | null;
  bestSessionVolume: ExerciseRecord | null;
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
