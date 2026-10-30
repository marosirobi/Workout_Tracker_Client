import {
  workoutService,
  type WorkoutDetailResponse,
} from "@/api/workoutService";
import { BestEfforts } from "@/components/summary/BestEfforts";
import { KeyStats } from "@/components/summary/KeyStats";
import { PaceChart } from "@/components/summary/PaceChart";
import { RouteMap } from "@/components/summary/RouteMap";
import { SplitsTable } from "@/components/summary/SplitsTable";
import { StatRows } from "@/components/summary/StatRows";
import {
  computeCardioSummary,
  computePaceSeries,
  computeSplits,
} from "@/utils/workoutAnalysis";
import { formatDuration, formatPace } from "@/utils/workoutFormat";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatWorkoutDate(iso: string): string {
  return new Date(iso).toLocaleString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WorkoutDetailsScreen() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const isFresh = fresh === "1";
  const router = useRouter();

  const [workout, setWorkout] = useState<WorkoutDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const close = useCallback(() => {
    if (isFresh) {
      router.replace("/dashboard");
    } else {
      router.back();
    }
  }, [isFresh, router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        close();
        return true;
      },
    );
    return () => subscription.remove();
  }, [close]);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const data = await workoutService.getWorkoutById(Number(id));
        setWorkout(data);
      } catch (error) {
        console.error("Hiba a részletek letöltésekor", error);
        Alert.alert("Hiba", "Nem sikerült betölteni az edzést.");
        close();
      } finally {
        setLoading(false);
      }
    };
    fetchWorkout();
  }, [id, close]);

  const summary = useMemo(
    () => (workout?.type === "CARDIO" ? computeCardioSummary(workout) : null),
    [workout],
  );

  const splits = useMemo(
    () =>
      workout?.type === "CARDIO"
        ? computeSplits(workout.trackPoints ?? [])
        : [],
    [workout],
  );

  const paceSeries = useMemo(
    () =>
      workout?.type === "CARDIO"
        ? computePaceSeries(workout.trackPoints ?? [])
        : [],
    [workout],
  );

  const handleDelete = () => {
    Alert.alert("Törlés", "Biztosan törölni szeretnéd ezt az edzést?", [
      { text: "Mégsem", style: "cancel" },
      {
        text: "Törlés",
        style: "destructive",
        onPress: async () => {
          try {
            await workoutService.deleteWorkout(Number(id));
            router.replace("/dashboard");
          } catch {
            Alert.alert("Hiba", "Nem sikerült törölni az edzést.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC4C02" />
      </View>
    );
  }

  if (!workout) return null;

  const typeLabel = workout.type === "CARDIO" ? "Kardió" : "Erőedzés";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={close} hitSlop={12}>
          <Text style={styles.topBarAction}>{isFresh ? "Kész" : "Vissza"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {workout.type === "CARDIO" && (
          <RouteMap points={workout.trackPoints ?? []} />
        )}
        <View style={styles.body}>
          {isFresh && <Text style={styles.congrats}>Szép munka!</Text>}

          <Text style={styles.title}>{workout.workoutTitle || typeLabel}</Text>
          <Text style={styles.meta}>
            {formatWorkoutDate(workout.startTime)} · {typeLabel}
          </Text>
          {workout.workoutNote ? (
            <Text style={styles.note}>{workout.workoutNote}</Text>
          ) : null}

          {summary && (
            <View style={styles.section}>
              <KeyStats
                items={[
                  {
                    label: "Táv",
                    value: summary.distanceKm.toFixed(2),
                    unit: "km",
                  },
                  {
                    label: "Átl. tempó",
                    value: formatPace(summary.avgPaceMinPerKm),
                    unit: "/km",
                  },
                  {
                    label: "Mozgásidő",
                    value: formatDuration(summary.movingSeconds),
                  },
                ]}
              />
              <StatRows
                rows={[
                  {
                    label: "Teljes idő",
                    value: formatDuration(summary.elapsedSeconds),
                  },
                  {
                    label: "Átl. sebesség",
                    value: `${summary.avgSpeedKmh.toFixed(1)} km/h`,
                  },
                  {
                    label: "Max. sebesség",
                    value: `${summary.maxSpeedKmh.toFixed(1)} km/h`,
                  },
                  {
                    label: "Szintemelkedés",
                    value: `${Math.round(summary.elevationGain)} m`,
                  },
                ]}
              />
              <SplitsTable splits={splits} />
              <BestEfforts efforts={workout.bestEfforts ?? []} />
              <PaceChart
                series={paceSeries}
                avgPace={summary.avgPaceMinPerKm}
              />
            </View>
          )}

          {workout.type === "STRENGTH" && workout.exercises && (
            <View style={styles.section}>
              {workout.exercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <Text style={styles.exerciseName}>
                    {exercise.exerciseName}
                  </Text>
                  {exercise.sets.map((set) => (
                    <View key={set.id} style={styles.setRow}>
                      <Text style={styles.setText}>{set.setNumber}. szett</Text>
                      <Text style={styles.setText}>{set.weight} kg</Text>
                      <Text style={styles.setText}>{set.reps} ism.</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>Edzés törlése</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  center: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: { paddingHorizontal: 20, paddingVertical: 12 },
  topBarAction: { color: "#FC4C02", fontSize: 16, fontWeight: "600" },
  content: { paddingBottom: 40 },
  congrats: {
    color: "#FC4C02",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: { color: "#FFF", fontSize: 26, fontWeight: "800" },
  meta: { color: "#8E8E93", fontSize: 14, marginTop: 4 },
  note: { color: "#C7C7CC", fontSize: 15, lineHeight: 21, marginTop: 12 },
  section: { marginTop: 20 },
  exerciseCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  exerciseName: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
    paddingVertical: 8,
  },
  setText: { color: "#FFF", fontSize: 15 },
  deleteButton: { alignItems: "center", paddingVertical: 18, marginTop: 24 },
  deleteText: { color: "#FF453A", fontSize: 16, fontWeight: "600" },
  body: { paddingHorizontal: 20, paddingTop: 16 },
});
