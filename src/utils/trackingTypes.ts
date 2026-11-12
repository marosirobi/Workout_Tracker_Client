import type { TFunction } from "i18next";

export type TrackingType =
  | "WEIGHT_REPS"
  | "BODYWEIGHT"
  | "WEIGHTED_BODYWEIGHT"
  | "DURATION";

export const DEFAULT_TRACKING_TYPE: TrackingType = "WEIGHT_REPS";

export const usesWeight = (type: TrackingType) =>
  type === "WEIGHT_REPS" || type === "WEIGHTED_BODYWEIGHT";

export const usesReps = (type: TrackingType) => type !== "DURATION";

export const weightUnitLabel = (type: TrackingType) =>
  type === "WEIGHTED_BODYWEIGHT" ? "+kg" : "kg";

export function setHeaderLabels(type: TrackingType, t: TFunction): string[] {
  const set = t("setHeaders.set");
  const done = t("setHeaders.done");
  const reps = t("setHeaders.reps");

  switch (type) {
    case "BODYWEIGHT":
      return [set, t("setHeaders.bodyweight"), reps, done];
    case "WEIGHTED_BODYWEIGHT":
      return [set, t("setHeaders.plusWeight"), reps, done];
    case "DURATION":
      return [set, t("setHeaders.time"), t("setHeaders.stopwatch"), done];
    default:
      return [set, t("setHeaders.weight"), reps, done];
  }
}
