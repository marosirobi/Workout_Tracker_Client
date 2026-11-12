import type { TFunction } from "i18next";

export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "LEGS"
  | "SHOULDERS"
  | "BICEPS"
  | "TRICEPS"
  | "ABS";

export const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  "CHEST",
  "BACK",
  "LEGS",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "ABS",
];

export const muscleGroupLabel = (group: MuscleGroup, t: TFunction): string =>
  t(`muscleGroups.${group}`);
