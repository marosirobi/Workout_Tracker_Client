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

export function setHeaderLabels(type: TrackingType): string[] {
  switch (type) {
    case "BODYWEIGHT":
      return ["Szett", "Testsúly", "Ismétlés", "Kész"];
    case "WEIGHTED_BODYWEIGHT":
      return ["Szett", "Plusz súly", "Ismétlés", "Kész"];
    case "DURATION":
      return ["Szett", "Idő", "Stopper", "Kész"];
    default:
      return ["Szett", "Súly", "Ismétlés", "Kész"];
  }
}
