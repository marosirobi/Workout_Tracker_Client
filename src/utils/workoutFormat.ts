import { currentLocale } from "@/i18n";
import { formatDecimal, formatInteger } from "@/utils/numberFormat";
import type { WorkoutExercise } from "@/store/workoutStore";
import { setVolume } from "@/utils/strengthAnalysis";
import { DEFAULT_TRACKING_TYPE } from "@/utils/trackingTypes";

export const formatDuration = (totalSecs: number): string => {
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  const min = minutes.toString().padStart(2, "0");
  const sec = seconds.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${min}:${sec}` : `${min}:${sec}`;
};

export const formatPace = (paceInMinutes: number): string => {
  if (!paceInMinutes || paceInMinutes <= 0 || paceInMinutes > 45)
    return "--:--";
  const minutes = Math.floor(paceInMinutes);
  const seconds = Math.round((paceInMinutes % 1) * 60);
  if (seconds === 60) return `${minutes + 1}:00`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const getAvgPaceMinutes = (
  elapsedSeconds: number,
  distanceKm: number,
): number => (distanceKm > 0.01 ? elapsedSeconds / 60 / distanceKm : 0);

export const getCurrentPaceMinutes = (speedMs: number): number =>
  speedMs > 0.4 ? 1000 / speedMs / 60 : 0;

export const MOVING_TIMEOUT_MS = 6000;

export const getLiveSpeedMs = (
  currentSpeedMs: number,
  lastMovedAt: number | null,
  now: number = Date.now(),
): number =>
  lastMovedAt !== null && now - lastMovedAt < MOVING_TIMEOUT_MS
    ? currentSpeedMs
    : 0;

export const formatClock = (isoDate: string): string =>
  new Date(isoDate).toLocaleTimeString(currentLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });

export const countCompletedSets = (exercises: WorkoutExercise[]): number =>
  exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.isCompleted).length,
    0,
  );

export const getEffectiveStartMs = (startTime: string, totalPausedMs: number) =>
  new Date(startTime).getTime() + totalPausedMs;

export const getTotalVolumeKg = (
  exercises: WorkoutExercise[],
  bodyWeightKg: number | null,
): number =>
  exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets
        .filter((s) => s.isCompleted)
        .reduce(
          (setSum, s) =>
            setSum +
            setVolume(ex.trackingType ?? DEFAULT_TRACKING_TYPE, s, bodyWeightKg),
          0,
        ),
    0,
  );

export const getCurrentExerciseInfo = (
  exercises: WorkoutExercise[],
): { name: string; setNumber: number } | null => {
  if (exercises.length === 0) return null;

  const active = exercises.find((ex) => ex.sets.some((s) => !s.isCompleted));
  const exercise = active ?? exercises[exercises.length - 1];
  const nextSet = exercise.sets.find((s) => !s.isCompleted);

  return {
    name: exercise.exerciseName,
    setNumber: nextSet ? nextSet.setNumber : exercise.sets.length,
  };
};

export const formatWeight = (kg: number, locale: string): string =>
  formatDecimal(kg, locale, 1, false);

export const formatVolume = (kg: number, locale: string): string =>
  formatInteger(kg, locale);

export const formatKm = (km: number, locale: string, digits = 2): string =>
  formatDecimal(km, locale, digits);

export const formatSpeed = (kmh: number, locale: string): string =>
  formatDecimal(kmh, locale, 1);

export const formatSetDuration = (totalSeconds: number): string => {
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};
