import { MuscleGroup } from "@/utils/muscleGroups";
import { axiosClient } from "./axiosClient";

export interface Exercise {
  id: number;
  exerciseName: string;
  muscleGroup: MuscleGroup;
}

export const exerciseService = {
  getAllExercises: async (): Promise<Exercise[]> => {
    const response = await axiosClient.get("/exercises");
    return response.data;
  },
};
