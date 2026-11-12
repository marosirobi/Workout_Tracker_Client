import {
  WorkoutLiveActivity,
  type WorkoutActivityProps,
} from "@/widgets/WorkoutLiveActivity";
import { logger } from "@/utils/logger";
import { addUserInteractionListener, type LiveActivity } from "expo-widgets";
import type { LiveWorkoutDisplay, LiveWorkoutSnapshot } from "./types";

let current: LiveActivity<WorkoutActivityProps> | null = null;

const toProps = (s: LiveWorkoutSnapshot): WorkoutActivityProps => {
  const base = {
    type: s.type,
    isPaused: s.isPaused,
    effectiveStartMs: s.effectiveStartMs,
    pausedAtMs: s.pausedAtMs ?? 0,
  };

  if (s.type === "CARDIO") {
    return {
      ...base,
      title: "Cardio",
      metric1Value: s.distanceKm.toFixed(2),
      metric1Label: "KM",
      metric2Value: s.avgPace,
      metric2Label: "Average pace",
      detail: `${s.currentPace} /km`,
    };
  }

  return {
    ...base,
    title: "Workout",
    metric1Value: String(s.completedSets),
    metric1Label: "Set",
    metric2Value: String(Math.round(s.volumeKg)),
    metric2Label: "KG",
    detail: s.exerciseName
      ? `${s.exerciseName} · ${s.setNumber}. set`
      : "choose exercise",
  };
};

export const liveDisplay: LiveWorkoutDisplay = {
  async requestPermission() {
    return true;
  },
  async show(snapshot) {
    const props = toProps(snapshot);
    try {
      if (!current) current = WorkoutLiveActivity.getInstances()[0] ?? null;

      if (current) {
        await current.update(props);
      } else {
        current = WorkoutLiveActivity.start(
          props,
          "workouttrackerclient://active-workout",
        );
      }
    } catch (e) {
      logger.warn("Live Activity hiba", e);
    }
  },

  async hide() {
    current = null;
    const all = WorkoutLiveActivity.getInstances();
    await Promise.all(all.map((activity) => activity.end("immediate")));
  },

  addActionListener(callback) {
    const subscription = addUserInteractionListener((event) => {
      if (event.target === "pause" || event.target === "resume") {
        callback(event.target);
      }
    });
    return () => subscription.remove();
  },
};
