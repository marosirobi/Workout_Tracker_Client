import {
  exerciseService,
  type ExerciseRecord,
  type ExerciseStats,
} from "@/api/exerciseService";
import {
  ProgressChart,
  type ProgressPoint,
} from "@/components/exercise/ProgressChart";
import { FilterChips, type FilterOption } from "@/components/FilterChips";
import { StatRows } from "@/components/summary/StatRows";
import { MUSCLE_GROUP_LABELS } from "@/utils/muscleGroups";
import { formatVolume, formatWeight } from "@/utils/workoutFormat";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChartMetric = "WEIGHT" | "ONE_REP_MAX" | "VOLUME";

const METRIC_OPTIONS: FilterOption<ChartMetric>[] = [
  { value: "WEIGHT", label: "Súly" },
  { value: "ONE_REP_MAX", label: "1RM" },
  { value: "VOLUME", label: "Volumen" },
];

const formatKg = (value: number) => `${formatWeight(value)} kg`;
const formatVolumeKg = (value: number) => `${formatVolume(value)} kg`;

function recordValue(
  record: ExerciseRecord | null,
  format: (value: number) => string,
): string {
  return record ? format(record.value) : "–";
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [metric, setMetric] = useState<ChartMetric>("WEIGHT");

  const chartPoints = useMemo<ProgressPoint[]>(() => {
    if (!stats) return [];
    return stats.history.map((session) => ({
      time: new Date(session.startTime).getTime(),
      value:
        metric === "WEIGHT"
          ? session.maxWeight
          : metric === "ONE_REP_MAX"
            ? session.bestOneRepMax
            : session.bestSessionVolume,
    }));
  }, [stats, metric]);

  const formatTick =
    metric === "VOLUME"
      ? (value: number) => formatVolume(value)
      : (value: number) => formatWeight(value);

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

  const renderBody = () => {
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
        <Text style={styles.muscleGroup}>
          {MUSCLE_GROUP_LABELS[stats.muscleGroup]}
        </Text>

        {stats.history.length === 0 ? (
          <Text style={[styles.muted, styles.centered]}>
            Még nem csináltad ezt a gyakorlatot.
          </Text>
        ) : (
          <>
            <ProgressChart
              points={chartPoints}
              unit="kg"
              formatTick={formatTick}
            />

            <View style={styles.filters}>
              <FilterChips
                options={METRIC_OPTIONS}
                selected={metric}
                onSelect={setMetric}
              />
            </View>

            <Text style={styles.sectionTitle}>REKORDOK</Text>
            <StatRows
              rows={[
                {
                  label: "Legnehezebb súly",
                  value: recordValue(stats.heaviestWeight, formatKg),
                },
                {
                  label: "Becsült 1RM",
                  value: recordValue(stats.bestOneRepMax, formatKg),
                },
                {
                  label: "Legjobb szett volumen",
                  value: recordValue(stats.bestSetVolume, formatVolumeKg),
                },
                {
                  label: "Legjobb edzés volumen",
                  value: recordValue(stats.bestSessionVolume, formatVolumeKg),
                },
              ]}
            />
          </>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color="#FC4C02" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {stats?.exerciseName ?? ""}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderBody()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerSide: { width: 40 },
  title: {
    flex: 1,
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  muscleGroup: {
    color: "#8E8E93",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  filters: { marginTop: 14, alignItems: "center" },
  sectionTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 4,
  },
  spinner: { marginTop: 40 },
  muted: { color: "#8E8E93", fontSize: 15, marginTop: 20 },
  centered: { textAlign: "center" },
});
