import type {
  TrackPointResponse,
  WorkoutDetailResponse,
} from "@/api/workoutService";
import { calculateDistance } from "./locationUtils";

const MAX_REALISTIC_SPEED_MS = 20;
const MAX_SPEED_WINDOW_SEC = 10;
const MIN_LAST_SPLIT_METERS = 50;

export interface CardioSummary {
  distanceKm: number;
  movingSeconds: number;
  elapsedSeconds: number;
  avgPaceMinPerKm: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  elevationGain: number;
}

export interface Split {
  index: number;
  distanceKm: number;
  durationSeconds: number;
  pacedMinPerKm: number;
}

// szegmensekre bontas, hogy szunet sebessege ne legyen szamolva
export function splitIntoSegments(
  points: TrackPointResponse[],
): TrackPointResponse[][] {
  const segments: TrackPointResponse[][] = [];
  let current: TrackPointResponse[] = [];

  for (const point of points) {
    const prev = current[current.length - 1];
    if (prev && prev.segment !== point.segment) {
      segments.push(current);
      current = [];
    }
    current.push(point);
  }
  if (current.length > 0) segments.push(current);

  return segments;
}

export function computeMaxSpeedMs(points: TrackPointResponse[]): number {
  let max = 0;

  for (const segment of splitIntoSegments(points)) {
    const times = segment.map((p) => Date.parse(p.timestamp));

    const cumMeters = [0];
    for (let i = 1; i < segment.length; i++) {
      const a = segment[i - 1];
      const b = segment[i];
      cumMeters.push(
        cumMeters[i - 1] +
          calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude) *
            1000,
      );
    }

    let end = 0;
    for (let start = 0; start < segment.length; start++) {
      if (end < start) end = start;

      while (
        end < segment.length - 1 &&
        (times[end] - times[start]) / 1000 < MAX_SPEED_WINDOW_SEC
      ) {
        end++;
      }

      const dtSec = (times[end] - times[start]) / 1000;
      if (dtSec < MAX_SPEED_WINDOW_SEC) break;

      const speed = (cumMeters[end] - cumMeters[start]) / dtSec;
      if (speed <= MAX_REALISTIC_SPEED_MS && speed > max) {
        max = speed;
      }
    }
  }
  return max;
}

export function computeCardioSummary(
  workout: WorkoutDetailResponse,
): CardioSummary {
  const stats = workout.cardioStats;
  const distanceKm = stats?.totalDistance ?? 0;
  const movingSeconds = stats?.movingTimeSeconds ?? 0;

  const elapsedSeconds = workout.endTime
    ? Math.max(
        0,
        Math.round(
          (Date.parse(workout.endTime) - Date.parse(workout.startTime)) / 1000,
        ),
      )
    : movingSeconds;

  const avgPaceMinPerKm =
    distanceKm > 0.01 && movingSeconds > 0
      ? movingSeconds / 60 / distanceKm
      : 0;

  const avgSpeedKmh =
    movingSeconds > 0 ? distanceKm / (movingSeconds / 3600) : 0;

  const maxSpeedKmh = Math.max(
    computeMaxSpeedMs(workout.trackPoints ?? []) * 3.6,
    avgSpeedKmh,
  );

  return {
    distanceKm,
    movingSeconds,
    elapsedSeconds,
    avgPaceMinPerKm,
    avgSpeedKmh,
    maxSpeedKmh,
    elevationGain: stats?.elevationGain ?? 0,
  };
}

function makeSplit(
  index: number,
  meters: number,
  durationSeconds: number,
): Split {
  const distanceKm = meters / 1000;
  return {
    index,
    distanceKm,
    durationSeconds,
    pacedMinPerKm: distanceKm > 0 ? durationSeconds / 60 / distanceKm : 0,
  };
}

export function computeSplits(
  points: TrackPointResponse[],
  splitMeters = 1000,
): Split[] {
  const splits: Split[] = [];
  let splitDistance = 0;
  let splitTime = 0;

  for (const segment of splitIntoSegments(points)) {
    for (let i = 1; i < segment.length; i++) {
      const a = segment[i - 1];
      const b = segment[i];

      let stepMeters =
        calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude) *
        1000;
      let stepSeconds =
        (Date.parse(b.timestamp) - Date.parse(a.timestamp)) / 1000;

      if (stepMeters <= 0 || stepSeconds <= 0) continue;

      while (splitDistance + stepMeters >= splitMeters) {
        const neededMeters = splitMeters - splitDistance;
        const fraction = neededMeters / stepMeters;
        const neededSeconds = stepSeconds * fraction;

        splits.push(
          makeSplit(splits.length + 1, splitMeters, splitTime + neededSeconds),
        );

        stepMeters -= neededMeters;
        stepSeconds -= neededSeconds;
        splitDistance = 0;
        splitTime = 0;
      }

      splitDistance += stepMeters;
      splitTime += stepSeconds;
    }
  }

  if (splitDistance >= MIN_LAST_SPLIT_METERS) {
    splits.push(makeSplit(splits.length + 1, splitDistance, splitTime));
  }

  return splits;
}
