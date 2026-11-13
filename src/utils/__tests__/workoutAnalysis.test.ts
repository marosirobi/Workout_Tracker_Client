import type {
  TrackPointResponse,
  WorkoutDetailResponse,
} from "@/api/workoutService";
import {
  computeCardioSummary,
  computeMaxSpeedMs,
  computePaceSeries,
  computeSplits,
  splitIntoSegments,
} from "@/utils/workoutAnalysis";

const METERS_PER_DEGREE = 111_195;
const T0 = Date.parse("2026-11-01T08:00:00Z");

const point = (meters: number, seconds: number, segment = 0): TrackPointResponse => ({
  latitude: 47 + meters / METERS_PER_DEGREE,
  longitude: 19,
  elevation: 100,
  speed: 0,
  timestamp: new Date(T0 + seconds * 1000).toISOString(),
  segment,
});

const run = (
  fromMeters: number,
  toMeters: number,
  stepMeters: number,
  startSeconds: number,
  speedMs: number,
  segment = 0,
): TrackPointResponse[] => {
  const points: TrackPointResponse[] = [];
  for (let m = fromMeters; m <= toMeters + 0.001; m += stepMeters) {
    points.push(point(m, startSeconds + (m - fromMeters) / speedMs, segment));
  }
  return points;
};

describe("splitIntoSegments", () => {
  test("starts a new segment when the segment number changes", () => {
    const points = [point(0, 0, 0), point(10, 5, 0), point(50, 60, 1), point(60, 65, 1)];

    expect(splitIntoSegments(points).map((s) => s.length)).toEqual([2, 2]);
  });

  test("empty input gives no segments", () => {
    expect(splitIntoSegments([])).toEqual([]);
  });
});

describe("computeSplits", () => {
  test("full kilometres plus the remainder", () => {
    const splits = computeSplits(run(0, 2500, 100, 0, 4));

    expect(splits).toHaveLength(3);
    expect(splits[0].durationSeconds).toBeCloseTo(250, 0);
    expect(splits[0].pacedMinPerKm).toBeCloseTo(250 / 60, 2);
    expect(splits[2].distanceKm).toBeCloseTo(0.5, 2);
    expect(splits[2].durationSeconds).toBeCloseTo(125, 0);
  });

  test("tiny remainder is dropped", () => {
    expect(computeSplits(run(0, 1030, 10, 0, 4))).toHaveLength(1);
  });

  test("pause between segments is not counted", () => {
    const points = [...run(0, 600, 100, 0, 4, 0), ...run(700, 1200, 100, 900, 4, 1)];

    expect(computeSplits(points)[0].durationSeconds).toBeCloseTo(250, 0);
  });
});

describe("computeMaxSpeedMs", () => {
  test("constant pace", () => {
    expect(computeMaxSpeedMs(run(0, 600, 20, 0, 4))).toBeCloseTo(4, 1);
  });

  test("short unrealistic jump is ignored", () => {
    const points = [...run(0, 400, 20, 0, 4), ...run(1400, 1800, 20, 105, 4)];

    expect(computeMaxSpeedMs(points)).toBeCloseTo(4, 1);
  });

  test("too short track gives zero", () => {
    expect(computeMaxSpeedMs(run(0, 20, 10, 0, 4))).toBe(0);
  });
});

describe("computeCardioSummary", () => {
  const workout: WorkoutDetailResponse = {
    id: 1,
    workoutTitle: "Run",
    workoutNote: null,
    type: "CARDIO",
    startTime: "2026-11-01T08:00:00Z",
    endTime: "2026-11-01T08:30:00Z",
    cardioStats: { totalDistance: 5, avgPace: "5:00", movingTimeSeconds: 1500, elevationGain: 40 },
    trackPoints: [],
  };

  test("averages from stats", () => {
    expect(computeCardioSummary(workout)).toEqual({
      distanceKm: 5,
      movingSeconds: 1500,
      elapsedSeconds: 1800,
      avgPaceMinPerKm: 5,
      avgSpeedKmh: 12,
      maxSpeedKmh: 12,
      elevationGain: 40,
    });
  });

  test("unfinished workout uses moving time as elapsed", () => {
    expect(computeCardioSummary({ ...workout, endTime: null }).elapsedSeconds).toBe(1500);
  });

  test("missing stats give zeros", () => {
    const summary = computeCardioSummary({ ...workout, cardioStats: null });

    expect(summary.distanceKm).toBe(0);
    expect(summary.avgPaceMinPerKm).toBe(0);
    expect(summary.avgSpeedKmh).toBe(0);
  });
});

describe("computePaceSeries", () => {
  test("constant pace gives a flat line", () => {
    const [line] = computePaceSeries(run(0, 600, 20, 0, 4));

    expect(line.length).toBeGreaterThan(0);
    line.forEach((p) => expect(p.paceMinPerKm).toBeCloseTo(1000 / 4 / 60, 1));
  });

  test("each segment is a separate line with continuing distance", () => {
    const series = computePaceSeries([...run(0, 400, 20, 0, 4, 0), ...run(500, 900, 20, 400, 4, 1)]);

    expect(series).toHaveLength(2);
    expect(series[1][0].distanceKm).toBeGreaterThan(series[0][series[0].length - 1].distanceKm);
  });
});
