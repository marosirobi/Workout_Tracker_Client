import { workoutService } from "@/api/workoutService";
import { useWorkoutStore } from "@/store/workoutStore";
import { stopLocationTracking } from "./locationTask";

export async function endActiveWorkoutLocally(
  savedWorkoutId?: number,
): Promise<void> {
  await stopLocationTracking();
  const store = useWorkoutStore.getState();
  if (savedWorkoutId) {
    store.completeSave(savedWorkoutId);
  } else {
    store.clearActiveWorkout();
  }
}

export async function discardActiveWorkout(): Promise<void> {
  const { activeWorkoutId } = useWorkoutStore.getState();
  if (activeWorkoutId) {
    try {
      await workoutService.deleteWorkout(activeWorkoutId);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        throw error;
      }
    }
  }
  await endActiveWorkoutLocally();
}
