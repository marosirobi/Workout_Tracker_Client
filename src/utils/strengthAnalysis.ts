import type {
  ExerciseSetDetail,
  WorkoutDetailResponse,
  WorkoutExerciseDetail,
} from "@/api/workoutService";
import { MUSCLE_GROUP_ORDER, MuscleGroup } from "./muscleGroups";

export interface StrengthSummary {
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  exerciseCount: number;
  heaviestWeightKg: number;
}

export interface MuscleGroupSets {
  group: MuscleGroup;
  sets: number;
}

export function computeMuscleGroupSets(
  exercises: WorkoutExerciseDetail[],
): MuscleGroupSets[] {
  const counts = new Map<MuscleGroup, number>();

  for (const exercise of exercises) {
    if (!exercise.muscleGroup || exercise.sets.length === 0) continue;
    const prevCount = counts.get(exercise.muscleGroup) ?? 0;
    counts.set(exercise.muscleGroup, prevCount + exercise.sets.length);
  }

  return MUSCLE_GROUP_ORDER.filter((group) => counts.has(group))
    .map((group) => ({ group, sets: counts.get(group)! }))
    .sort((a, b) => b.sets - a.sets);
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
