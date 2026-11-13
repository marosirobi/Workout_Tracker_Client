import type { ExerciseSet, WorkoutExercise } from "@/store/workoutStore";
import type { TrackingType } from "@/utils/trackingTypes";
import {
  countCompletedSets,
  formatDuration,
  formatKm,
  formatPace,
  formatSetDuration,
  formatSpeed,
  formatVolume,
  formatWeight,
  getAvgPaceMinutes,
  getCurrentExerciseInfo,
  getCurrentPaceMinutes,
  getLiveSpeedMs,
  getTotalVolumeKg,
  MOVING_TIMEOUT_MS,
} from "@/utils/workoutFormat";

const normalize = (text: string) => text.replace(/\s/g, " ");

const set = (setNumber: number, weight: number, reps: number, isCompleted: boolean): ExerciseSet => ({
  setNumber,
  weight,
  reps,
  durationSeconds: 0,
  timerStartedAt: null,
  isCompleted,
});

const exercise = (name: string, trackingType: TrackingType, sets: ExerciseSet[]): WorkoutExercise => ({
  exerciseId: 0,
  exerciseName: name,
  orderIndex: 0,
  trackingType,
  sets,
});

describe("formatDuration", () => {
  test.each([
    [0, "00:00"],
    [65, "01:05"],
    [3725, "1:02:05"],
  ])("%d -> %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe("formatPace", () => {
  test.each([
    [5.5, "5:30"],
    [4.999, "5:00"],
    [0, "--:--"],
    [-1, "--:--"],
    [50, "--:--"],
  ])("%d -> %s", (pace, expected) => {
    expect(formatPace(pace)).toBe(expected);
  });
});

describe("pace helpers", () => {
  test("average pace", () => {
    expect(getAvgPaceMinutes(1500, 5)).toBe(5);
    expect(getAvgPaceMinutes(100, 0.005)).toBe(0);
  });

  test("current pace from speed", () => {
    expect(getCurrentPaceMinutes(4)).toBeCloseTo(4.1667, 3);
    expect(getCurrentPaceMinutes(0.3)).toBe(0);
  });
});

describe("getLiveSpeedMs", () => {
  const now = 100_000;

  test("recent movement keeps speed", () => {
    expect(getLiveSpeedMs(3, now - MOVING_TIMEOUT_MS + 1, now)).toBe(3);
  });

  test("after timeout speed drops to zero", () => {
    expect(getLiveSpeedMs(3, now - MOVING_TIMEOUT_MS, now)).toBe(0);
  });

  test("never moved gives zero", () => {
    expect(getLiveSpeedMs(3, null, now)).toBe(0);
  });
});

describe("active workout helpers", () => {
  const exercises = [
    exercise("Bench press", "WEIGHT_REPS", [set(1, 100, 5, true), set(2, 100, 5, false)]),
    exercise("Pull-up", "BODYWEIGHT", [set(1, 0, 10, true)]),
    exercise("Plank", "DURATION", [set(1, 0, 0, true)]),
  ];

  test("volume counts only completed sets", () => {
    expect(getTotalVolumeKg(exercises, 80)).toBe(500 + 800);
  });

  test("completed set count", () => {
    expect(countCompletedSets(exercises)).toBe(3);
  });

  test("current exercise is the first with an open set", () => {
    expect(getCurrentExerciseInfo(exercises)).toEqual({ name: "Bench press", setNumber: 2 });
  });

  test("all sets done points at the last exercise", () => {
    const done = [exercise("Squat", "WEIGHT_REPS", [set(1, 100, 5, true), set(2, 100, 5, true)])];

    expect(getCurrentExerciseInfo(done)).toEqual({ name: "Squat", setNumber: 2 });
  });

  test("no exercises gives null", () => {
    expect(getCurrentExerciseInfo([])).toBeNull();
  });
});

describe("formatSetDuration", () => {
  test.each([
    [90.4, "1:30"],
    [59.6, "1:00"],
    [5, "0:05"],
  ])("%d -> %s", (seconds, expected) => {
    expect(formatSetDuration(seconds)).toBe(expected);
  });
});

describe("locale aware formatters", () => {
  test.each([
    ["hu-HU", "5,23", "82,5", "12 500", "12,4"],
    ["en-US", "5.23", "82.5", "12,500", "12.4"],
  ])("%s", (locale, km, weight, volume, speed) => {
    expect(formatKm(5.234, locale)).toBe(km);
    expect(formatWeight(82.5, locale)).toBe(weight);
    expect(normalize(formatVolume(12500, locale))).toBe(volume);
    expect(formatSpeed(12.36, locale)).toBe(speed);
  });
});
