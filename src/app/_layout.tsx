import { startWorkoutLiveSync } from "@/services/live/workoutLiveSync";
import { syncLocationTrackingWithStore } from "@/services/locationTask";

import { useAuthStore } from "@/store/authStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
export default function RootLayout() {
  const { activeWorkoutId } = useWorkoutStore();
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
      router.replace("/dashboard" as any);
      return;
    }

    if (user) {
      if (activeWorkoutId && !isActiveWorkoutScreen) {
        router.replace("/active-workout" as any);
      } else if (!activeWorkoutId && isActiveWorkoutScreen) {
        router.replace("/dashboard" as any);
      }
    }
  }, [isReady, user, activeWorkoutId, segments, router]);

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
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="active-workout" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
