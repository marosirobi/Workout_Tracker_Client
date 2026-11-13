import type { ActivityWorkout } from "@/api/workoutService";
import {
  buildMonthCells,
  buildMonthList,
  countByDay,
  getMonthRange,
  monthKey,
  weekdayLabels,
} from "@/utils/calendar";

const november2026 = { year: 2026, month: 10 };

describe("buildMonthCells", () => {
  const cells = buildMonthCells(november2026);

  test("always fills a 6 week grid", () => {
    expect(cells).toHaveLength(42);
  });

  test("week starts on monday", () => {
    expect(cells.slice(0, 6)).toEqual(Array(6).fill(null));
    expect(cells[6]).toBe(1);
  });

  test("contains every day once", () => {
    expect(cells.filter((c) => c !== null)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });
});

test("getMonthRange covers the whole month", () => {
  const { from, to } = getMonthRange(november2026);

  expect(from).toEqual(new Date(2026, 10, 1));
  expect(to.getTime()).toBe(new Date(2026, 11, 1).getTime() - 1);
});

test("buildMonthList goes back across the year boundary", () => {
  expect(buildMonthList(3, new Date(2026, 0, 15))).toEqual([
    { year: 2025, month: 10 },
    { year: 2025, month: 11 },
    { year: 2026, month: 0 },
  ]);
});

test("monthKey", () => {
  expect(monthKey(november2026)).toBe("2026-10");
});

test("countByDay groups workouts by local day", () => {
  const workout = (day: number, hour: number): ActivityWorkout => ({
    id: day * 100 + hour,
    type: "STRENGTH",
    startTime: new Date(2026, 10, day, hour).toISOString(),
  });

  expect(countByDay([workout(5, 8), workout(5, 18), workout(12, 10)])).toEqual({ 5: 2, 12: 1 });
});

test("weekdayLabels start with monday", () => {
  expect(weekdayLabels("en-US")[0]).toBe("Mon");
  expect(weekdayLabels("en-US")).toHaveLength(7);
});
