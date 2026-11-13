import type {
  ExerciseSetDetail,
  WorkoutDetailResponse,
  WorkoutExerciseDetail,
} from "@/api/workoutService";
import type { MuscleGroup } from "@/utils/muscleGroups";
import {
  computeMuscleGroupSets,
  computeStrengthSummary,
  exerciseVolume,
  findBestSet,
  setVolume,
} from "@/utils/strengthAnalysis";
import type { TrackingType } from "@/utils/trackingTypes";

const set = (
  weight: number,
  reps: number,
  durationSeconds: number | null = null,
): ExerciseSetDetail => ({ id: 0, setNumber: 1, weight, reps, durationSeconds });

const exercise = (
  trackingType: TrackingType,
  sets: ExerciseSetDetail[],
  muscleGroup: MuscleGroup | null = "CHEST",
): WorkoutExerciseDetail => ({
  id: 0,
  exerciseId: 0,
  exerciseName: "Test",
  orderIndex: 0,
  muscleGroup,
  weightRank: null,
  trackingType,
  sets,
});

describe("setVolume", () => {
  test.each<[TrackingType, number, number, number | null, number]>([
    ["WEIGHT_REPS", 20, 10, 80, 200],
    ["BODYWEIGHT", 0, 10, 80, 800],
    ["WEIGHTED_BODYWEIGHT", 20, 10, 80, 1000],
    ["DURATION", 20, 10, 80, 0],
    ["BODYWEIGHT", 0, 10, null, 0],
  ])("%s weight=%d reps=%d bodyWeight=%s -> %d", (type, weight, reps, bodyWeight, expected) => {
    expect(setVolume(type, { weight, reps }, bodyWeight)).toBe(expected);
  });
});

test("exerciseVolume sums every set", () => {
  expect(exerciseVolume(exercise("BODYWEIGHT", [set(0, 10), set(0, 8)]), 80)).toBe(1440);
});

describe("findBestSet", () => {
  test("weight exercise: heaviest wins, then more reps", () => {
    const best = set(100, 5);
    expect(findBestSet("WEIGHT_REPS", [set(90, 10), best, set(100, 3)])).toBe(best);
  });

  test("bodyweight exercise: most reps wins", () => {
    const best = set(0, 15);
    expect(findBestSet("BODYWEIGHT", [set(0, 10), best])).toBe(best);
  });

  test("duration exercise: longest wins", () => {
    const best = set(0, 0, 120);
    expect(findBestSet("DURATION", [set(0, 0, 60), best])).toBe(best);
  });

  test("no sets gives null", () => {
    expect(findBestSet("WEIGHT_REPS", [])).toBeNull();
  });
});

describe("computeStrengthSummary", () => {
  const workout: WorkoutDetailResponse = {
    id: 1,
    workoutTitle: "Push",
    workoutNote: null,
    type: "STRENGTH",
    startTime: "2026-11-01T10:00:00Z",
    endTime: "2026-11-01T11:00:00Z",
    bodyWeightKg: 80,
    exercises: [
      exercise("WEIGHT_REPS", [set(100, 5), set(110, 3)]),
      exercise("BODYWEIGHT", [set(0, 10)], "BACK"),
      exercise("WEIGHTED_BODYWEIGHT", [set(150, 2)], "BACK"),
    ],
  };

  test("totals", () => {
    expect(computeStrengthSummary(workout)).toEqual({
      durationSeconds: 3600,
      totalVolumeKg: 500 + 330 + 800 + 460,
      totalSets: 4,
      totalReps: 20,
      exerciseCount: 3,
      heaviestWeightKg: 110,
    });
  });

  test("heaviest weight ignores non weight-reps exercises", () => {
    const bodyweightOnly = { ...workout, exercises: [exercise("BODYWEIGHT", [set(0, 10)])] };
    expect(computeStrengthSummary(bodyweightOnly).heaviestWeightKg).toBeNull();
  });

  test("unfinished workout has zero duration", () => {
    expect(computeStrengthSummary({ ...workout, endTime: null }).durationSeconds).toBe(0);
  });
});

test("computeMuscleGroupSets sorts by set count and skips empty groups", () => {
  const result = computeMuscleGroupSets([
    exercise("WEIGHT_REPS", [set(1, 1), set(1, 1)], "CHEST"),
    exercise("WEIGHT_REPS", [set(1, 1), set(1, 1), set(1, 1)], "LEGS"),
    exercise("WEIGHT_REPS", [set(1, 1), set(1, 1)], "BACK"),
    exercise("WEIGHT_REPS", [], "ABS"),
    exercise("WEIGHT_REPS", [set(1, 1)], null),
  ]);

  expect(result).toEqual([
    { group: "LEGS", sets: 3 },
    { group: "CHEST", sets: 2 },
    { group: "BACK", sets: 2 },
  ]);
});
