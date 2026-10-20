import { workoutService } from "@/api/workoutService";
import { useWorkoutStore } from "@/store/workoutStore";
import { stopLocationTracking } from "./locationTask";

export async function endActiveWorkoutLocally(): Promise<void> {
  await stopLocationTracking();
  useWorkoutStore.getState().clearActiveWorkout();
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
