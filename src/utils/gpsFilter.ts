import { calculateDistance } from "@/utils/locationUtils";

export const MAX_SPEED_MS = 20;

export interface GpsFix {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export type SampleDecision =
  | { kind: "accept" }
  | { kind: "hold" }
  | { kind: "relocate"; from: GpsFix };

function impliedSpeedMs(from: GpsFix, to: GpsFix): number {
  const meters =
    calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude) *
    1000;
  const seconds = (to.timestamp - from.timestamp) / 1000;
  return seconds > 0 ? meters / seconds : Infinity;
}

export function classifySample(
  last: GpsFix,
  pending: GpsFix | null,
  sample: GpsFix,
): SampleDecision {
  if (impliedSpeedMs(last, sample) <= MAX_SPEED_MS) {
    return { kind: "accept" };
  }
  if (pending && impliedSpeedMs(pending, sample) <= MAX_SPEED_MS) {
    return { kind: "relocate", from: pending };
  }
  return { kind: "hold" };
}
