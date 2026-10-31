import type {
    ExerciseSetDetail,
    WorkoutDetailResponse,
} from "@/api/workoutService";

export interface StrengthSummary {
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  exerciseCount: number;
  heaviestWeightKg: number;
}

export const setVolume = (set: ExerciseSetDetail): number =>
  set.weight * set.reps;

export function findBestSet(
  sets: ExerciseSetDetail[],
): ExerciseSetDetail | null {
  return sets.reduce<ExerciseSetDetail | null>((best, set) => {
    if (!best) return set;
    if (set.weight > best.weight) return set;
    if (set.weight === best.weight && set.reps > best.reps) return set;
    return best;
  }, null);
}

export function computeStrengthSummary(
  workout: WorkoutDetailResponse,
): StrengthSummary {
  const exercises = workout.exercises ?? [];
  const allSets = exercises.flatMap((ex) => ex.sets);

  const durationSeconds = workout.endTime
    ? Math.max(
        0,
        Math.round(
          (new Date(workout.endTime).getTime() -
            new Date(workout.startTime).getTime()) /
            1000,
        ),
      )
    : 0;

  return {
    durationSeconds,
    totalVolumeKg: allSets.reduce((sum, set) => sum + setVolume(set), 0),
    totalSets: allSets.length,
    totalReps: allSets.reduce((sum, set) => sum + set.reps, 0),
    exerciseCount: exercises.length,
    heaviestWeightKg: allSets.reduce(
      (max, set) => Math.max(max, set.weight),
      0,
    ),
  };
}
