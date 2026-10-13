import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type WorkoutType = "STRENGTH" | "CARDIO";

export interface ExerciseSet {
  setNumber: number;
  weight: number;
  reps: number;
  isCompleted: boolean;
}

export interface WorkoutExercise {
  exerciseId: number;
  exerciseName: string;
  orderIndex: number;
  sets: ExerciseSet[];
}

export interface TrackPoint {
  latitude: number;
  longitude: number;
  elevation: number;
  speed: number;
  timestamp: string;
}

interface WorkoutState {
  activeWorkoutId: number | null;
  activeWorkoutType: WorkoutType | null;
  startTime: string | null;
  exercises: WorkoutExercise[];
  totalDistanceKm: number;
  trackPoints: TrackPoint[];

  setActiveWorkout: (id: number, type: WorkoutType, startTime: string) => void;
  clearActiveWorkout: () => void;

  addExercise: (exerciseId: number, exerciseName: string) => void;
  updateCardioStats: (newDistance: number, newPoint: TrackPoint) => void;
  addSet: (exerciseId: number) => void;
  updateSet: (
    exerciseId: number,
    setNumber: number,
    weight: number,
    reps: number,
    isCompleted: boolean,
  ) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      activeWorkoutId: null,
      activeWorkoutType: null,
      startTime: null,
      totalDistanceKm: 0,
      trackPoints: [],
      exercises: [],
      setActiveWorkout: (id, type, startTime) =>
        set({
          activeWorkoutId: id,
          activeWorkoutType: type,
          startTime,
          exercises: [],
        }),
      clearActiveWorkout: () =>
        set({
          activeWorkoutId: null,
          activeWorkoutType: null,
          startTime: null,
          exercises: [],
          totalDistanceKm: 0,
          trackPoints: [],
        }),
      addExercise: (exerciseId, exerciseName) =>
        set((state) => {
          const orderIndex = state.exercises.length;
          const newExercise: WorkoutExercise = {
            exerciseId,
            exerciseName,
            orderIndex,
            sets: [{ setNumber: 1, weight: 0, reps: 0, isCompleted: false }],
          };
          return { exercises: [...state.exercises, newExercise] };
        }),

      addSet: (exerciseId) =>
        set((state) => {
          const updatedExercise = state.exercises.map((ex) => {
            if (ex.exerciseId === exerciseId) {
              const nextSetNumber = ex.sets.length + 1;
              const lastSet = ex.sets[ex.sets.length - 1];
              return {
                ...ex,
                sets: [
                  ...ex.sets,
                  {
                    setNumber: nextSetNumber,
                    weight: lastSet ? lastSet.weight : 0,
                    reps: lastSet ? lastSet.reps : 0,
                    isCompleted: false,
                  },
                ],
              };
            }
            return ex;
          });
          return { exercises: updatedExercise };
        }),

      updateSet: (exerciseId, setNumber, weight, reps, isCompleted) =>
        set((state) => {
          const updatedExercise = state.exercises.map((ex) => {
            if (ex.exerciseId === exerciseId) {
              const updatedSets = ex.sets.map((s) =>
                s.setNumber === setNumber
                  ? { ...s, weight, reps, isCompleted }
                  : s,
              );
              return { ...ex, sets: updatedSets };
            }
            return ex;
          });
          return { exercises: updatedExercise };
        }),
      updateCardioStats: (newDistance, newPoint) =>
        set((state) => ({
          totalDistanceKm: state.totalDistanceKm + newDistance,
          trackPoints: [...state.trackPoints, newPoint],
        })),
    }),
    {
      name: "workout-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
