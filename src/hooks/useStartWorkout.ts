import { startWorkout, type TemplateToStart } from "@/services/workoutActions";
import { WorkoutType } from "@/store/workoutStore";
import { useState } from "react";
import { Alert } from "react-native";

export function useStartWorkout() {
  const [isStarting, setIsStarting] = useState(false);

  const start = async (type: WorkoutType, template?: TemplateToStart) => {
    if (isStarting) return;
    setIsStarting(true);

    try {
      await startWorkout(type, template);
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
