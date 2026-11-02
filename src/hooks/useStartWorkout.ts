import { startWorkout } from "@/services/workoutActions";
import { WorkoutType } from "@/store/workoutStore";
import { useState } from "react";
import { Alert } from "react-native";

export function useStartWorkout() {
  const [isStarting, setIsStarting] = useState(false);

  const start = async (type: WorkoutType) => {
    if (isStarting) return;
    setIsStarting(true);

    try {
      await startWorkout(type);
    } catch (error: any) {
      console.error(
        "Hiba az edzés indításakor:",
        error.response?.data || error.message,
      );
      Alert.alert(
        "Hiba",
        "Nem sikerült elindítani az edzést. Ellenőrizd az internetkapcsolatot!",
      );
    } finally {
      setIsStarting(false);
    }
  };

  return { start, isStarting };
}
