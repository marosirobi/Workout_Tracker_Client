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

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  CHEST: "Mell",
  BACK: "Hát",
  LEGS: "Láb",
  SHOULDERS: "Váll",
  BICEPS: "Bicepsz",
  TRICEPS: "Tricepsz",
  ABS: "Has",
};
