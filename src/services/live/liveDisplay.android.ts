import i18n, { currentLocale } from "@/i18n";
import { formatDuration, formatKm, formatVolume } from "@/utils/workoutFormat";
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
    ? `${i18n.t("notification.pausedPrefix", { time: formatDuration(s.elapsedSeconds) })}\n`
    : "";

  if (s.type === "CARDIO") {
    const km = formatKm(s.distanceKm, currentLocale());
    return {
      title: s.isPaused
        ? i18n.t("notification.cardioPausedTitle", { km })
        : i18n.t("notification.cardioTitle", { km }),
      text:
        pausedPrefix +
        i18n.t("notification.cardioText", { pace: s.currentPace, avg: s.avgPace }),
      chipText: s.isPaused
        ? i18n.t("notification.paused")
        : `${formatKm(s.distanceKm, currentLocale(), 1)} km`,
    };
  }

  const exercise = s.exerciseName
    ? i18n.t("notification.exerciseSet", { name: s.exerciseName, set: s.setNumber })
    : i18n.t("notification.addExercise");
  const sets = i18n.t("units.sets", { count: s.completedSets });

  return {
    title: s.isPaused
      ? i18n.t("notification.strengthPausedTitle", { sets })
      : i18n.t("notification.strengthTitle", { sets }),
    text:
      pausedPrefix +
      i18n.t("notification.strengthText", {
        exercise,
        volume: formatVolume(s.volumeKg, currentLocale()),
      }),
    chipText: s.isPaused ? i18n.t("notification.paused") : null,
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
      pauseLabel: i18n.t("notification.pause"),
      resumeLabel: i18n.t("notification.resume"),
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
