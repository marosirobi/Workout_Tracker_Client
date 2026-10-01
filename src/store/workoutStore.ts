import { create } from "zustand";

type WorkoutType = "STRENGTH" | "CARDIO";

interface WorkoutState {
  activeWorkoutId: number | null;
  activeWorkoutType: WorkoutType | null;
  startTime: string | null;

  setActiveWorkout: (id: number, type: WorkoutType, startTime: string) => void;
  clearActiveWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeWorkoutId: null,
  activeWorkoutType: null,
  startTime: null,

  setActiveWorkout: (id, type, startTime) =>
    set({ activeWorkoutId: id, activeWorkoutType: type, startTime: startTime }),

  clearActiveWorkout: () =>
    set({ activeWorkoutId: null, activeWorkoutType: null, startTime: null }),
}));
