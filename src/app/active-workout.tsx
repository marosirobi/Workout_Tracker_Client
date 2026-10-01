import ActiveWorkoutScreen from "@/screens/ActiveWorkoutScreen";
import { Stack } from "expo-router";

export default function ActiveWorkout() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <ActiveWorkoutScreen />
    </>
  );
}
