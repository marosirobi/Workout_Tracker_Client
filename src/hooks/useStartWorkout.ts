import { userService, type UserResponse } from "@/api/userService";
import { startWorkout, type TemplateToStart } from "@/services/workoutActions";
import { useAuthStore } from "@/store/authStore";
import { WorkoutType } from "@/store/workoutStore";
import { useRef, useState } from "react";
import { Alert } from "react-native";

export function useStartWorkout() {
  const [isStarting, setIsStarting] = useState(false);
  const [isPromptVisible, setPromptVisible] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  const resolvePromptRef = useRef<((saved: boolean) => void) | null>(null);
  const meRef = useRef<UserResponse | null>(null);

  const askForBodyWeight = () =>
    new Promise<boolean>((resolve) => {
      resolvePromptRef.current = resolve;
      setPromptVisible(true);
    });

  const closePrompt = (saved: boolean) => {
    setPromptVisible(false);
    resolvePromptRef.current?.(saved);
    resolvePromptRef.current = null;
  };

  const ensureBodyWeight = async (): Promise<boolean> => {
    const me = await userService.getMe();
    meRef.current = me;
    useAuthStore.getState().updateUser({ bodyWeightKg: me.bodyWeightKg });

    if (me.bodyWeightKg) {
      return true;
    }

    return askForBodyWeight();
  };

  const submitBodyWeight = async (weightKg: number) => {
    const me = meRef.current;
    if (!me) return;

    setIsSavingWeight(true);
    try {
      const updated = await userService.updateMe({
        username: me.username,
        email: me.email,
        bodyWeightKg: weightKg,
      });
      useAuthStore.getState().updateUser({ bodyWeightKg: updated.bodyWeightKg });
      closePrompt(true);
    } catch (error: any) {
      console.error(
        "Hiba a testsúly mentésekor:",
        error.response?.data || error.message,
      );
      Alert.alert(
        "Sikertelen mentés",
        "Nem sikerült elmenteni a testsúlyt. Próbáld újra!",
      );
    } finally {
      setIsSavingWeight(false);
    }
  };

  const start = async (type: WorkoutType, template?: TemplateToStart) => {
    if (isStarting) return;
    setIsStarting(true);

    try {
      const hasBodyWeight = await ensureBodyWeight();
      if (!hasBodyWeight) return;

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

  return {
    start,
    isStarting,
    bodyWeightModal: {
      visible: isPromptVisible,
      isSaving: isSavingWeight,
      onSubmit: submitBodyWeight,
      onCancel: () => closePrompt(false),
    },
  };
}
