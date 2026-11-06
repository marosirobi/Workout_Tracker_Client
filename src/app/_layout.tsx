import { startWorkoutLiveSync } from "@/services/live/workoutLiveSync";
import { syncLocationTrackingWithStore } from "@/services/locationTask";
import { useAuthStore } from "@/store/authStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

const ROUTES_ALLOWED_DURING_WORKOUT = ["exercises"];

export default function RootLayout() {
  const { activeWorkoutId, isAwaitingSave, lastSavedWorkoutId } =
    useWorkoutStore();
  const { user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady) {
      syncLocationTrackingWithStore();
      startWorkoutLiveSync();
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !segments) return;

    const isAuthScreen = segments[0] === "login" || segments[0] === "register";
    const isActiveWorkoutScreen = segments[0] === "active-workout";

    if (!user && !isAuthScreen) {
      router.replace("/login" as any);
      return;
    }

    if (user && isAuthScreen) {
      router.replace("/" as any);
      return;
    }

    if (user) {
      const isSaveScreen = segments[0] === "save-workout";

      if (activeWorkoutId) {
        const target = isAwaitingSave ? "save-workout" : "active-workout";
        const isAllowedOverlay =
          !isAwaitingSave &&
          ROUTES_ALLOWED_DURING_WORKOUT.includes(segments[0]);

        if (segments[0] !== target && !isAllowedOverlay) {
          router.replace(`/${target}` as any);
        }
      } else if (isActiveWorkoutScreen || isSaveScreen) {
        router.replace(
          lastSavedWorkoutId
            ? `/workouts/${lastSavedWorkoutId}?fresh=1`
            : ("/" as any),
        );
      }
    }
  }, [
    user,
    activeWorkoutId,
    segments,
    router,
    isAwaitingSave,
    isReady,
    lastSavedWorkoutId,
  ]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
        }}
      >
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="active-workout" options={{ gestureEnabled: false }} />
      <Stack.Screen name="save-workout" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
