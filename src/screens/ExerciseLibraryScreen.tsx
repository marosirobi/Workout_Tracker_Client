import { exerciseService, type Exercise } from "@/api/exerciseService";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ExerciseBrowser } from "@/components/workout/ExerciseBrowser";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExerciseLibraryScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const data = await exerciseService.getAllExercises();
        if (isActive) setExercises(data);
      } catch (error: any) {
        console.error(
          "Hiba a gyakorlatok betöltésekor",
          error.response?.data || error.message,
        );
        if (isActive) setLoadFailed(true);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, []);

  const renderBody = () => {
    if (isLoading) {
      return <ActivityIndicator color="#FC4C02" style={styles.spinner} />;
    }
    if (loadFailed) {
      return (
        <Text style={styles.muted}>
          {t("exercises.loadFailed")}
        </Text>
      );
    }
    return (
      <ExerciseBrowser
        exercises={exercises}
        onSelect={(exercise) => router.push(`/exercises/${exercise.id}`)}
        showChevron
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title={t("exercises.title")} onBack={() => router.back()} />
      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  spinner: { marginTop: 40 },
  muted: {
    color: "#8E8E93",
    fontSize: 15,
    textAlign: "center",
    marginTop: 40,
  },
});
