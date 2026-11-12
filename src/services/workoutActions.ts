import { workoutService } from "@/api/workoutService";
import {
  useWorkoutStore,
  WorkoutExercise,
  type WorkoutType,
} from "@/store/workoutStore";
import { DEFAULT_TRACKING_TYPE } from "@/utils/trackingTypes";
import { stopLocationTracking } from "./locationTask";

export interface TemplateToStart {
  id: number;
  name: string;
}

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

export async function startWorkout(
  type: WorkoutType,
  template?: TemplateToStart,
): Promise<void> {
  const created = await workoutService.createWorkout({
    type,
    startTime: new Date().toISOString(),
    templateId: template?.id ?? null,
  });

  const exercises: WorkoutExercise[] = (created.exercises ?? []).map((ex) => ({
    exerciseId: ex.exerciseId,
    exerciseName: ex.exerciseName,
    orderIndex: ex.orderIndex,
    trackingType: ex.trackingType ?? DEFAULT_TRACKING_TYPE,
    sets: ex.sets.map((set) => ({
      setNumber: set.setNumber,
      weight: set.weight,
      reps: set.reps,
      durationSeconds: set.durationSeconds ?? 0,
      timerStartedAt: null,
      isCompleted: false,
    })),
  }));

  useWorkoutStore
    .getState()
    .setActiveWorkout(created.id, created.type, created.startTime, {
      exercises,
      templateName: template?.name ?? null,
      bodyWeightKg: created.bodyWeightKg ?? null,
    });
}
