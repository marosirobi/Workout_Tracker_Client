import type { WorkoutType } from "@/store/workoutStore";
import type { TFunction } from "i18next";

export const defaultWorkoutTitle = (type: WorkoutType, t: TFunction): string =>
  t(`workoutType.${type}`);
