import type {
  ExerciseSetDetail,
  WorkoutDetailResponse,
  WorkoutExerciseDetail,
} from "@/api/workoutService";
import { MUSCLE_GROUP_ORDER, MuscleGroup } from "./muscleGroups";
import { DEFAULT_TRACKING_TYPE, type TrackingType } from "./trackingTypes";

export interface StrengthSummary {
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  exerciseCount: number;
  heaviestWeightKg: number | null;
}

export interface MuscleGroupSets {
  group: MuscleGroup;
  sets: number;
}

export const exerciseTrackingType = (
  exercise: WorkoutExerciseDetail,
): TrackingType => exercise.trackingType ?? DEFAULT_TRACKING_TYPE;

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

export function setVolume(
  type: TrackingType,
  set: Pick<ExerciseSetDetail, "weight" | "reps">,
  bodyWeightKg: number | null,
): number {
  const bodyWeight = bodyWeightKg ?? 0;
  switch (type) {
    case "BODYWEIGHT":
      return bodyWeight * set.reps;
    case "WEIGHTED_BODYWEIGHT":
      return (bodyWeight + set.weight) * set.reps;
    case "DURATION":
      return 0;
    default:
      return set.weight * set.reps;
  }
}

export const exerciseVolume = (
  exercise: WorkoutExerciseDetail,
  bodyWeightKg: number | null,
): number =>
  exercise.sets.reduce(
    (sum, set) =>
      sum + setVolume(exerciseTrackingType(exercise), set, bodyWeightKg),
    0,
  );

function compareSets(
  type: TrackingType,
  a: ExerciseSetDetail,
  b: ExerciseSetDetail,
): number {
  switch (type) {
    case "BODYWEIGHT":
      return a.reps - b.reps;
    case "DURATION":
      return (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0);
    default:
      return a.weight !== b.weight ? a.weight - b.weight : a.reps - b.reps;
  }
}

export function findBestSet(
  type: TrackingType,
  sets: ExerciseSetDetail[],
): ExerciseSetDetail | null {
  return sets.reduce<ExerciseSetDetail | null>(
    (best, set) => (!best || compareSets(type, set, best) > 0 ? set : best),
    null,
  );
}

export function computeStrengthSummary(
  workout: WorkoutDetailResponse,
): StrengthSummary {
  const exercises = workout.exercises ?? [];
  const bodyWeightKg = workout.bodyWeightKg ?? null;
  const allSets = exercises.flatMap((ex) => ex.sets);
  const weightRepsSets = exercises
    .filter((ex) => exerciseTrackingType(ex) === "WEIGHT_REPS")
    .flatMap((ex) => ex.sets);

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
    totalVolumeKg: exercises.reduce(
      (sum, ex) => sum + exerciseVolume(ex, bodyWeightKg),
      0,
    ),
    totalSets: allSets.length,
    totalReps: allSets.reduce((sum, set) => sum + set.reps, 0),
    exerciseCount: exercises.length,
    heaviestWeightKg:
      weightRepsSets.length > 0
        ? Math.max(...weightRepsSets.map((set) => set.weight))
        : null,
  };
}
