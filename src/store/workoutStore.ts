import { classifySample } from "@/utils/gpsFilter";
import { calculateDistance } from "@/utils/locationUtils";
import {
  DEFAULT_TRACKING_TYPE,
  type TrackingType,
} from "@/utils/trackingTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type WorkoutType = "STRENGTH" | "CARDIO";

export interface ExerciseSet {
  setNumber: number;
  weight: number;
  reps: number;
  durationSeconds: number;
  timerStartedAt: number | null;
  isCompleted: boolean;
}

export interface WorkoutExercise {
  exerciseId: number;
  exerciseName: string;
  orderIndex: number;
  trackingType: TrackingType;
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
  templateName: string | null;
  bodyWeightKg: number | null;

  //cardio
  totalDistanceKm: number;
  trackPoints: TrackPoint[];
  elevationGain: number;
  currentSpeedMs: number;
  lastCoords: LastCoords | null;
  pendingJump: LocationSample | null;
  currentSegment: number;
  lastMovedAt: number | null;

  pausedAt: string | null;
  totalPausedMs: number;

  isAwaitingSave: boolean;
  lastSavedWorkoutId: number | null;
}

interface WorkoutState extends ActiveWorkoutData {
  setActiveWorkout: (
    id: number,
    type: WorkoutType,
    startTime: string,
    options?: {
      exercises?: WorkoutExercise[];
      templateName?: string | null;
      bodyWeightKg?: number | null;
    },
  ) => void;
  clearActiveWorkout: () => void;

  addExercise: (
    exerciseId: number,
    exerciseName: string,
    trackingType: TrackingType,
  ) => void;
  addSet: (exerciseId: number) => void;
  moveExercise: (exerciseId: number, direction: -1 | 1) => void;
  updateSet: (
    exerciseId: number,
    setNumber: number,
    changes: Partial<ExerciseSet>,
  ) => void;
  startSetTimer: (exerciseId: number, setNumber: number) => void;
  stopSetTimer: (exerciseId: number, setNumber: number) => void;

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
  templateName: null,
  bodyWeightKg: null,
  totalDistanceKm: 0,
  trackPoints: [],
  elevationGain: 0,
  currentSpeedMs: 0,
  lastCoords: null,
  pendingJump: null,
  currentSegment: 0,
  lastMovedAt: null,
  pausedAt: null,
  totalPausedMs: 0,
  isAwaitingSave: false,
  lastSavedWorkoutId: null,
};

const createSet = (setNumber: number, from?: ExerciseSet): ExerciseSet => ({
  setNumber,
  weight: from?.weight ?? 0,
  reps: from?.reps ?? 0,
  durationSeconds: from?.durationSeconds ?? 0,
  timerStartedAt: null,
  isCompleted: false,
});

const finishTimer = (set: ExerciseSet, now: number): ExerciseSet =>
  set.timerStartedAt == null
    ? set
    : {
        ...set,
        durationSeconds: Math.round((now - set.timerStartedAt) / 1000),
        timerStartedAt: null,
      };

const toTrackPoint = (sample: LocationSample, segment: number): TrackPoint => ({
  latitude: sample.latitude,
  longitude: sample.longitude,
  elevation: Math.round(sample.altitude ?? 0),
  speed: Number(
    (sample.speed && sample.speed > 0 ? sample.speed : 0).toFixed(2),
  ),
  segment,
  timestamp: new Date(sample.timestamp).toISOString(),
});

const MAX_ACCURACY_METERS = 25;
const MIN_STEP_KM = 0.002;
const ELEVATION_NOISE_M = 2;

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      ...EMPTY_WORKOUT,

      setActiveWorkout: (id, type, startTime, options) =>
        set({
          ...EMPTY_WORKOUT,
          activeWorkoutId: id,
          activeWorkoutType: type,
          startTime,
          exercises: options?.exercises ?? [],
          templateName: options?.templateName ?? null,
          bodyWeightKg: options?.bodyWeightKg ?? null,
        }),

      clearActiveWorkout: () => set({ ...EMPTY_WORKOUT }),

      addExercise: (exerciseId, exerciseName, trackingType) =>
        set((state) => {
          const newExercise: WorkoutExercise = {
            exerciseId,
            exerciseName,
            orderIndex: state.exercises.length,
            trackingType: trackingType ?? DEFAULT_TRACKING_TYPE,
            sets: [createSet(1)],
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
              sets: [...ex.sets, createSet(ex.sets.length + 1, lastSet)],
            };
          }),
        })),

      moveExercise: (exerciseId, direction) =>
        set((state) => {
          const index = state.exercises.findIndex(
            (ex) => ex.exerciseId === exerciseId,
          );
          const target = index + direction;
          if (index === -1 || target < 0 || target >= state.exercises.length) {
            return state;
          }

          const exercises = [...state.exercises];
          [exercises[index], exercises[target]] = [
            exercises[target],
            exercises[index],
          ];

          return {
            exercises: exercises.map((ex, i) => ({ ...ex, orderIndex: i })),
          };
        }),

      updateSet: (exerciseId, setNumber, changes) =>
        set((state) => ({
          exercises: state.exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.setNumber === setNumber ? { ...s, ...changes } : s,
              ),
            };
          }),
        })),

      startSetTimer: (exerciseId, setNumber) =>
        set((state) => {
          const now = Date.now();
          return {
            exercises: state.exercises.map((ex) => ({
              ...ex,
              sets: ex.sets.map((s) => {
                const isTarget =
                  ex.exerciseId === exerciseId && s.setNumber === setNumber;
                if (isTarget) {
                  return { ...s, durationSeconds: 0, timerStartedAt: now };
                }
                return finishTimer(s, now);
              }),
            })),
          };
        }),

      stopSetTimer: (exerciseId, setNumber) =>
        set((state) => {
          const now = Date.now();
          return {
            exercises: state.exercises.map((ex) =>
              ex.exerciseId !== exerciseId
                ? ex
                : {
                    ...ex,
                    sets: ex.sets.map((s) =>
                      s.setNumber === setNumber ? finishTimer(s, now) : s,
                    ),
                  },
            ),
          };
        }),

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
          const newPoint = toTrackPoint(sample, state.currentSegment);

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

          const decision = classifySample(
            last,
            state.pendingJump ?? null,
            sample,
          );

          if (decision.kind === "hold") {
            return { pendingJump: sample };
          }

          if (decision.kind === "relocate") {
            const from = decision.from as LocationSample;
            const nextSegment = state.currentSegment + 1;
            const pointsInSegment = state.trackPoints.filter(
              (p) => p.segment === state.currentSegment,
            ).length;
            const keptPoints =
              pointsInSegment === 1
                ? state.trackPoints.slice(0, -1)
                : state.trackPoints;
            const confirmKm = calculateDistance(
              from.latitude,
              from.longitude,
              sample.latitude,
              sample.longitude,
            );
            return {
              currentSegment: nextSegment,
              currentSpeedMs: speed,
              lastMovedAt: Date.now(),
              pendingJump: null,
              totalDistanceKm: state.totalDistanceKm + confirmKm,
              trackPoints: [
                ...keptPoints,
                toTrackPoint(from, nextSegment),
                toTrackPoint(sample, nextSegment),
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
            pendingJump: null,
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
            pendingJump: null,
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
