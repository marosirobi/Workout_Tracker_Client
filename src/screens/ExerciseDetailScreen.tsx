import { exerciseService, ExerciseStats } from "@/api/exerciseService";
import { MUSCLE_GROUP_LABELS } from "@/utils/muscleGroups";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExercisedetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const data = await exerciseService.getExerciseStats(Number(id));
        if (isActive) setStats(data);
      } catch (error: any) {
        console.error(
          "Hiba a gyakorlat betöltésekor",
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
  }, [id]);

  const RenderContent = () => {
    if (isLoading) {
      return <ActivityIndicator color="#FC4C02" style={styles.spinner} />;
    }
    if (loadFailed || !stats) {
      return (
        <Text style={styles.muted}>Nem sikerült betölteni a gyakorlatot.</Text>
      );
    }
    return (
      <>
        <Text style={styles.title}>{stats.exerciseName}</Text>
        <Text style={styles.subtitle}>
          {MUSCLE_GROUP_LABELS[stats.muscleGroup]}
        </Text>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>Vissza</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.content}>
          {RenderContent()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  topBar: { paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: "#FC4C02", fontSize: 16, fontWeight: "600" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  spinner: { marginTop: 40 },
  title: { color: "#FFF", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#8E8E93", fontSize: 15, marginTop: 4 },
  muted: { color: "#8E8E93", fontSize: 15, marginTop: 20 },
});
