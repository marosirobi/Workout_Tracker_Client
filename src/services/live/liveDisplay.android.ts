import { formatDuration } from "@/utils/workoutFormat";
import { PermissionsAndroid, Platform } from "react-native";
import workoutNotification from "../../../modules/workout-notification";
import type { LiveWorkoutDisplay, LiveWorkoutSnapshot } from "./types";

const ACCENT = "#FC4C02";

async function hasPermission(): Promise<boolean> {
  if (typeof Platform.Version === "number" && Platform.Version < 33)
    return true;
  return PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
}

function toNotification(s: LiveWorkoutSnapshot) {
  const pausedPrefix = s.isPaused
    ? `Szüneteltetve · ${formatDuration(s.elapsedSeconds)}\n`
    : "";

  if (s.type === "CARDIO") {
    return {
      title: s.isPaused
        ? `Szünet · ${s.distanceKm.toFixed(2)} km`
        : `Kardió · ${s.distanceKm.toFixed(2)} km`,
      text: `${pausedPrefix}Tempó ${s.currentPace} /km  •  Átlag ${s.avgPace} /km`,
      chipText: s.isPaused ? "Szünet" : `${s.distanceKm.toFixed(1)} km`,
    };
  }

  const exercise = s.exerciseName
    ? `${s.exerciseName} · ${s.setNumber}. szett`
    : "Adj hozzá egy gyakorlatot";

  return {
    title: s.isPaused
      ? `Szünet · ${s.completedSets} szett`
      : `Erőedzés · ${s.completedSets} szett`,
    text: `${pausedPrefix}${exercise}  •  ${Math.round(s.volumeKg)} kg összesen`,
    chipText: s.isPaused ? "Szünet" : null,
  };
}

export const liveDisplay: LiveWorkoutDisplay = {
  async requestPermission() {
    if (await hasPermission()) return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  },

  async show(snapshot) {
    if (!workoutNotification) return;
    const keepAlive = snapshot.type === "CARDIO";
    if (!keepAlive && !(await hasPermission())) return;

    workoutNotification.show({
      ...toNotification(snapshot),
      chronometerBaseMs: snapshot.effectiveStartMs,
      isPaused: snapshot.isPaused,
      accentColor: ACCENT,
      keepAlive,
    });
  },

  async hide() {
    workoutNotification?.hide();
  },

  addActionListener(callback) {
    const subscription = workoutNotification?.addListener("onAction", (event) =>
      callback(event.action),
    );
    return () => subscription?.remove();
  },
};
