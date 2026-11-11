import { getElapsedSeconds, useWorkoutStore } from "@/store/workoutStore";
import {
  countCompletedSets,
  formatPace,
  getAvgPaceMinutes,
  getCurrentExerciseInfo,
  getCurrentPaceMinutes,
  getEffectiveStartMs,
  getLiveSpeedMs,
  getTotalVolumeKg,
  MOVING_TIMEOUT_MS,
} from "@/utils/workoutFormat";
import { liveDisplay } from "./liveDisplay";
import type { LiveWorkoutSnapshot } from "./types";

const MIN_UPDATE_INTERVAL_MS = 5000;

type WorkoutState = ReturnType<typeof useWorkoutStore.getState>;

let started = false;
let isShowing = false;
let lastKey = "";
let lastSentAt = 0;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let staleTimer: ReturnType<typeof setTimeout> | null = null;

function buildSnapshot(state: WorkoutState): LiveWorkoutSnapshot | null {
  if (!state.activeWorkoutId || !state.activeWorkoutType || !state.startTime)
    return null;

  const elapsedSeconds = getElapsedSeconds(state);
  const current = getCurrentExerciseInfo(state.exercises);

  return {
    type: state.activeWorkoutType,
    isPaused: state.pausedAt !== null,
    effectiveStartMs: getEffectiveStartMs(state.startTime, state.totalPausedMs),
    pausedAtMs: state.pausedAt ? new Date(state.pausedAt).getTime() : null,
    elapsedSeconds,
    distanceKm: state.totalDistanceKm,
    avgPace: formatPace(
      getAvgPaceMinutes(elapsedSeconds, state.totalDistanceKm),
    ),
    currentPace: formatPace(
      getCurrentPaceMinutes(
        getLiveSpeedMs(state.currentSpeedMs, state.lastMovedAt),
      ),
    ),
    completedSets: countCompletedSets(state.exercises),
    volumeKg: getTotalVolumeKg(state.exercises),
    exerciseName: current?.name ?? null,
    setNumber: current?.setNumber ?? null,
  };
}

function scheduleStaleCheck(state: WorkoutState) {
  if (staleTimer) clearTimeout(staleTimer);
  staleTimer = null;

  if (state.activeWorkoutType !== "CARDIO") return;
  if (state.pausedAt || state.lastMovedAt === null) return;

  const expiresIn = state.lastMovedAt + MOVING_TIMEOUT_MS - Date.now();
  if (expiresIn <= 0) return;

  staleTimer = setTimeout(() => {
    staleTimer = null;
    sync();
  }, expiresIn + 100);
}

function sync(force = false) {
  const state = useWorkoutStore.getState();
  const snapshot = buildSnapshot(state);
  scheduleStaleCheck(state);

  if (!snapshot) {
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = null;
    if (isShowing) {
      isShowing = false;
      lastKey = "";
      void liveDisplay.hide();
    }
    return;
  }

  const { elapsedSeconds, ...visible } = snapshot;
  const key = JSON.stringify(visible);
  if (key === lastKey) return;

  const wait = MIN_UPDATE_INTERVAL_MS - (Date.now() - lastSentAt);
  if (!force && isShowing && wait > 0) {
    if (!pendingTimer) {
      pendingTimer = setTimeout(() => {
        pendingTimer = null;
        sync();
      }, wait);
    }
    return;
  }

  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = null;
  lastKey = key;
  lastSentAt = Date.now();
  isShowing = true;
  void liveDisplay.show(snapshot);
}

export async function startWorkoutLiveSync(): Promise<void> {
  if (started) return;
  started = true;

  if (!useWorkoutStore.persist.hasHydrated()) {
    await new Promise<void>((resolve) => {
      const unsubscribe = useWorkoutStore.persist.onFinishHydration(() => {
        unsubscribe();
        resolve();
      });
    });
  }

  liveDisplay.addActionListener((action) => {
    const { pauseWorkout, resumeWorkout } = useWorkoutStore.getState();
    if (action === "pause") pauseWorkout();
    else resumeWorkout();
  });

  useWorkoutStore.subscribe((state, prev) => {
    const important =
      state.pausedAt !== prev.pausedAt ||
      state.activeWorkoutId !== prev.activeWorkoutId;
    sync(important);
  });

  if (!buildSnapshot(useWorkoutStore.getState())) {
    void liveDisplay.hide();
  }
  sync(true);
}

export async function prepareLiveDisplay(): Promise<void> {
  await liveDisplay.requestPermission();
  lastKey = "";
  sync(true);
}
