import { WorkoutType } from "@/store/workoutStore";

export type LiveAction = "pause" | "resume";

export type LiveWorkoutSnapshot = {
  type: WorkoutType;
  isPaused: boolean;
  effectiveStartMs: number;
  pausedAtMs: number | null;
  elapsedSeconds: number;

  distanceKm: number;
  avgPace: string;
  currentPace: string;

  completedSets: number;
  volumeKg: number;
  exerciseName: string | null;
  setNumber: number | null;
};

export interface LiveWorkoutDisplay {
  requestPermission(): Promise<boolean>;
  show(snapshot: LiveWorkoutSnapshot): Promise<void>;
  hide(): Promise<void>;
  addActionListener(callback: (action: LiveAction) => void): () => void;
}
