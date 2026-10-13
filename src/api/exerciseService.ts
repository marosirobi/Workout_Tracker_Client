import { axiosClient } from "./axiosClient";

export const exerciseService = {
  getAllExercises: async () => {
    const response = await axiosClient.get("/exercises");
    return response.data;
  },
};
