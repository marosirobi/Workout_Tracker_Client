import i18n from "@/i18n";
import { useWorkoutStore } from "@/store/workoutStore";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Alert, Platform } from "react-native";

export const LOCATION_TASK_NAME = "workout-location-task";

export type TrackingMode = "background" | "foreground" | "denied";

const LOCATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 2000,
  distanceInterval: 2,
};

let foregroundSubscription: Location.LocationSubscription | null = null;

const saveLocations = (locations: Location.LocationObject[]) => {
  const { recordLocation } = useWorkoutStore.getState();

  for (const location of locations) {
    recordLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    });
  }
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn("gps hiba:", error.message);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };

  if (!useWorkoutStore.persist.hasHydrated()) {
    await useWorkoutStore.persist.rehydrate();
  }

  saveLocations(locations);
});

const explainBackgroundPermission = () =>
  new Promise<void>((resolve) => {
    Alert.alert(
      i18n.t("location.backgroundTitle"),
      i18n.t("location.backgroundMessage"),
      [{ text: i18n.t("common.ok"), onPress: () => resolve() }],
      { cancelable: false },
    );
  });

export async function startLocationTracking(): Promise<TrackingMode> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    return "denied";
  }

  if (Platform.OS === "android") {
    await startForegroundWatch();
    return "background";
  }

  let background = await Location.getBackgroundPermissionsAsync();
  if (background.status !== "granted" && background.canAskAgain) {
    await explainBackgroundPermission();
    background = await Location.requestBackgroundPermissionsAsync();
  }

  if (background.status === "granted") {
    try {
      const alreadyRunning =
        await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

      if (!alreadyRunning) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          ...LOCATION_OPTIONS,
          activityType: Location.ActivityType.Fitness,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,

          foregroundService: {
            notificationTitle: i18n.t("location.notificationTitle"),
            notificationBody: i18n.t("location.notificationBody"),
            killServiceOnDestroy: false,
          },
        });
      }
      return "background";
    } catch (e) {
      console.warn("A háttér GPS nem indult el, előtér módra váltok:", e);
    }
  }

  await startForegroundWatch();
  return "foreground";
}

async function startForegroundWatch(): Promise<void> {
  if (foregroundSubscription) return;
  foregroundSubscription = await Location.watchPositionAsync(
    LOCATION_OPTIONS,
    (location) => saveLocations([location]),
  );
}

export async function stopLocationTracking(): Promise<void> {
  foregroundSubscription?.remove();
  foregroundSubscription = null;

  try {
    const running =
      await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

    if (running) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (e) {
    console.warn("Hiba a GPS leállításakor:", e);
  }
}

export async function syncLocationTrackingWithStore(): Promise<void> {
  const { activeWorkoutType } = useWorkoutStore.getState();
  if (activeWorkoutType !== "CARDIO") {
    await stopLocationTracking();
  }
}
