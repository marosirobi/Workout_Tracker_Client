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
  segment: number;
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
  timestamp: number;
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
  currentSegment: number;
  lastMovedAt: number | null;

  pausedAt: string | null;
  totalPausedMs: number;

  isAwaitingSave: boolean;
  lastSavedWorkoutId: number | null;
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
  beginFinish: () => void;
  cancelFinish: () => void;
  completeSave: (workoutId: number) => void;
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
  currentSegment: 0,
  lastMovedAt: null,
  pausedAt: null,
  totalPausedMs: 0,
  isAwaitingSave: false,
  lastSavedWorkoutId: null,
};

const MAX_ACCURACY_METERS = 25;
const MIN_STEP_KM = 0.002;
const MAX_SPEED_MS = 20;
const ELEVATION_NOISE_M = 2;

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
            segment: state.currentSegment,
            timestamp: new Date(sample.timestamp).toISOString(),
          };

          const last = state.lastCoords;

          if (!last) {
            return {
              currentSpeedMs: 0,
              trackPoints: [...state.trackPoints, newPoint],
              lastCoords: {
                latitude: sample.latitude,
                longitude: sample.longitude,
                elevation,
                timestamp: sample.timestamp,
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
            return { currentSpeedMs: 0 };
          }

          const dtSec = (sample.timestamp - last.timestamp) / 1000;
          const impliedSpeed = dtSec > 0 ? (stepKm * 1000) / dtSec : Infinity;
          if (impliedSpeed > MAX_SPEED_MS) {
            const nextSegment = state.currentSegment + 1;
            return {
              currentSegment: nextSegment,
              currentSpeedMs: 0,
              trackPoints: [
                ...state.trackPoints,
                { ...newPoint, segment: nextSegment },
              ],
              lastCoords: {
                latitude: sample.latitude,
                longitude: sample.longitude,
                elevation,
                timestamp: sample.timestamp,
              },
            };
          }

          const altDiff = elevation - last.elevation;
          let climbed = 0;
          let refElevation = last.elevation;

          if (altDiff >= ELEVATION_NOISE_M && altDiff < 30) {
            climbed = altDiff;
            refElevation = elevation;
          } else if (altDiff <= -ELEVATION_NOISE_M) {
            refElevation = elevation;
          }

          return {
            currentSpeedMs: speed,
            lastMovedAt: Date.now(),
            totalDistanceKm: state.totalDistanceKm + stepKm,
            elevationGain: state.elevationGain + climbed,
            trackPoints: [...state.trackPoints, newPoint],
            lastCoords: {
              latitude: sample.latitude,
              longitude: sample.longitude,
              elevation: refElevation,
              timestamp: sample.timestamp,
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
            lastMovedAt: null,
            currentSegment: state.currentSegment + 1,
          };
        }),

      beginFinish: () =>
        set((state) => {
          if (!state.activeWorkoutId) return state;
          return {
            isAwaitingSave: true,
            pausedAt: state.pausedAt ?? new Date().toISOString(),
            currentSpeedMs: 0,
          };
        }),

      cancelFinish: () => set({ isAwaitingSave: false }),

      completeSave: (workoutId) =>
        set({ ...EMPTY_WORKOUT, lastSavedWorkoutId: workoutId }),
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
