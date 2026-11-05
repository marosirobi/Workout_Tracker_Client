import { MuscleGroup } from "@/utils/muscleGroups";
import { axiosClient } from "./axiosClient";

export interface TemplateExerciseResponse {
  id: number;
  targetSets: number;
  exerciseName: string;
  muscleGroup: MuscleGroup | null;
  exerciseId: number;
}

export interface TemplateResponse {
  id: number;
  templateName: string;
  exercises: TemplateExerciseResponse[];
}

export interface TemplateExerciseRequest {
  exerciseId: number;
  orderIndex: number;
  targetSets: number;
}

export interface TemplateRequest {
  templateName: string;
  exercises: TemplateExerciseRequest[] | null;
}

export const templateService = {
  getMyTemplates: async (): Promise<TemplateResponse[]> => {
    const response = await axiosClient.get("/templates");
    return response.data;
  },

  createTemplate: async (
    request: TemplateRequest,
  ): Promise<TemplateResponse> => {
    const response = await axiosClient.post("/templates", request);
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await axiosClient.delete(`/templates/${id}`);
  },

  updateTemplate: async (
    request: TemplateRequest,
    id: number,
  ): Promise<TemplateResponse> => {
    const response = await axiosClient.put(`/templates/${id}`, request);
    return response.data;
  },
};
