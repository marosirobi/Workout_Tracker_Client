import { calculateDistance } from "@/utils/locationUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type WorkoutType = "STRENGTH" | "CARDIO";

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

export interface LocationSample {
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
}

interface LastCoords {
  latitude: number;
  longitude: number;
  elevation: number;
}

interface ActiveWorkoutData {
  activeWorkoutId: number | null;
  activeWorkoutType: WorkoutType | null;
  startTime: string | null;
  exercises: WorkoutExercise[];

  //cardio
  totalDistanceKm: number;
  trackPoints: TrackPoint[];
  elevationGain: number;
  currentSpeedMs: number;
  lastCoords: LastCoords | null;

  pausedAt: string | null;
  totalPausedMs: number;
}

interface WorkoutState extends ActiveWorkoutData {
  setActiveWorkout: (id: number, type: WorkoutType, startTime: string) => void;
  clearActiveWorkout: () => void;

  addExercise: (exerciseId: number, exerciseName: string) => void;
  addSet: (exerciseId: number) => void;
  updateSet: (
    exerciseId: number,
    setNumber: number,
    weight: number,
    reps: number,
    isCompleted: boolean,
  ) => void;

  recordLocation: (sample: LocationSample) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
}

const EMPTY_WORKOUT: ActiveWorkoutData = {
  activeWorkoutId: null,
  activeWorkoutType: null,
  startTime: null,
  exercises: [],
  totalDistanceKm: 0,
  trackPoints: [],
  elevationGain: 0,
  currentSpeedMs: 0,
  lastCoords: null,
  pausedAt: null,
  totalPausedMs: 0,
};

const MAX_ACCURACY_METERS = 25;
const MIN_STEP_KM = 0.002;

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      ...EMPTY_WORKOUT,

      setActiveWorkout: (id, type, startTime) =>
        set({
          ...EMPTY_WORKOUT,
          activeWorkoutId: id,
          activeWorkoutType: type,
          startTime,
        }),

      clearActiveWorkout: () => set({ ...EMPTY_WORKOUT }),

      addExercise: (exerciseId, exerciseName) =>
        set((state) => {
          const newExercise: WorkoutExercise = {
            exerciseId,
            exerciseName,
            orderIndex: state.exercises.length,
            sets: [{ setNumber: 1, weight: 0, reps: 0, isCompleted: false }],
          };
          return { exercises: [...state.exercises, newExercise] };
        }),

      addSet: (exerciseId) =>
        set((state) => ({
          exercises: state.exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex;
            const lastSet = ex.sets[ex.sets.length - 1];
            return {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  setNumber: ex.sets.length + 1,
                  weight: lastSet ? lastSet.weight : 0,
                  reps: lastSet ? lastSet.reps : 0,
                  isCompleted: false,
                },
              ],
            };
          }),
        })),

      updateSet: (exerciseId, setNumber, weight, reps, isCompleted) =>
        set((state) => ({
          exercises: state.exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.setNumber === setNumber
                  ? { ...s, weight, reps, isCompleted }
                  : s,
              ),
            };
          }),
        })),

      recordLocation: (sample) =>
        set((state) => {
          if (state.activeWorkoutType !== "CARDIO" || state.pausedAt) {
            return state;
          }

          if (
            sample.accuracy !== null &&
            sample.accuracy > MAX_ACCURACY_METERS
          ) {
            return state;
          }

          const elevation = sample.altitude ?? 0;
          const speed = sample.speed && sample.speed > 0 ? sample.speed : 0;

          const newPoint: TrackPoint = {
            latitude: sample.latitude,
            longitude: sample.longitude,
            elevation: Math.round(elevation),
            speed: Number(speed.toFixed(2)),
            timestamp: new Date(sample.timestamp).toISOString(),
          };

          const last = state.lastCoords;

          if (!last) {
            return {
              currentSpeedMs: speed,
              trackPoints: [...state.trackPoints, newPoint],
              lastCoords: {
                latitude: sample.latitude,
                longitude: sample.longitude,
                elevation,
              },
            };
          }

          const stepKm = calculateDistance(
            last.latitude,
            last.longitude,
            sample.latitude,
            sample.longitude,
          );

          if (stepKm < MIN_STEP_KM) {
            return { currentSpeedMs: speed };
          }

          const altDiff = elevation - last.elevation;
          const climbed = altDiff >= 0.5 && altDiff < 30 ? altDiff : 0;

          return {
            currentSpeedMs: speed,
            totalDistanceKm: state.totalDistanceKm + stepKm,
            elevationGain: state.elevationGain + climbed,
            trackPoints: [...state.trackPoints, newPoint],
            lastCoords: {
              latitude: sample.latitude,
              longitude: sample.longitude,
              elevation,
            },
          };
        }),

      pauseWorkout: () =>
        set((state) => {
          if (!state.startTime || state.pausedAt) return state;
          return { pausedAt: new Date().toISOString(), currentSpeedMs: 0 };
        }),

      resumeWorkout: () =>
        set((state) => {
          if (!state.pausedAt) return state;
          const pausedForMs = Date.now() - new Date(state.pausedAt).getTime();
          return {
            pausedAt: null,
            totalPausedMs: state.totalPausedMs + pausedForMs,
            lastCoords: null,
          };
        }),
    }),
    {
      name: "workout-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const getElapsedSeconds = (
  state: Pick<ActiveWorkoutData, "startTime" | "pausedAt" | "totalPausedMs">,
  now: number = Date.now(),
): number => {
  if (!state.startTime) return 0;
  const start = new Date(state.startTime).getTime();
  const end = state.pausedAt ? new Date(state.pausedAt).getTime() : now;
  return Math.max(0, Math.floor((end - start - state.totalPausedMs) / 1000));
};
