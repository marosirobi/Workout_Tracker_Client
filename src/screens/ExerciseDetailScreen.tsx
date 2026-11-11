import {
  exerciseService,
  type ExerciseRecord,
  type ExerciseSessionStat,
  type ExerciseStats,
} from "@/api/exerciseService";
import {
  ProgressChart,
  type ProgressPoint,
} from "@/components/exercise/ProgressChart";
import { FilterChips, type FilterOption } from "@/components/FilterChips";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatRows } from "@/components/summary/StatRows";
import { MUSCLE_GROUP_LABELS } from "@/utils/muscleGroups";
import {
  DEFAULT_TRACKING_TYPE,
  type TrackingType,
} from "@/utils/trackingTypes";
import {
  formatSetDuration,
  formatVolume,
  formatWeight,
} from "@/utils/workoutFormat";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChartMetric = "WEIGHT" | "ONE_REP_MAX" | "VOLUME" | "REPS" | "DURATION";

function metricOptions(type: TrackingType): FilterOption<ChartMetric>[] {
  switch (type) {
    case "BODYWEIGHT":
      return [
        { value: "REPS", label: "Ismétlés" },
        { value: "VOLUME", label: "Volumen" },
      ];
    case "WEIGHTED_BODYWEIGHT":
      return [
        { value: "WEIGHT", label: "Plusz súly" },
        { value: "REPS", label: "Ismétlés" },
        { value: "VOLUME", label: "Volumen" },
      ];
    case "DURATION":
      return [{ value: "DURATION", label: "Idő" }];
    default:
      return [
        { value: "WEIGHT", label: "Súly" },
        { value: "ONE_REP_MAX", label: "1RM" },
        { value: "VOLUME", label: "Volumen" },
      ];
  }
}

function metricValue(session: ExerciseSessionStat, metric: ChartMetric): number {
  switch (metric) {
    case "WEIGHT":
      return session.maxWeight ?? 0;
    case "ONE_REP_MAX":
      return session.bestOneRepMax ?? 0;
    case "VOLUME":
      return session.bestSessionVolume ?? 0;
    case "REPS":
      return session.maxReps ?? 0;
    case "DURATION":
      return session.maxDurationSeconds ?? 0;
  }
}

const METRIC_UNITS: Record<ChartMetric, string> = {
  WEIGHT: "kg",
  ONE_REP_MAX: "kg",
  VOLUME: "kg",
  REPS: "ism",
  DURATION: "p:mp",
};

function tickFormatter(metric: ChartMetric): (value: number) => string {
  switch (metric) {
    case "VOLUME":
      return formatVolume;
    case "REPS":
      return (value) => `${Math.round(value)}`;
    case "DURATION":
      return formatSetDuration;
    default:
      return formatWeight;
  }
}

const formatKg = (value: number) => `${formatWeight(value)} kg`;
const formatPlusKg = (value: number) => `+${formatWeight(value)} kg`;
const formatVolumeKg = (value: number) => `${formatVolume(value)} kg`;
const formatReps = (value: number) => `${Math.round(value)} ism`;

function valueFormatter(
  metric: ChartMetric,
  type: TrackingType,
): (value: number) => string {
  switch (metric) {
    case "VOLUME":
      return formatVolumeKg;
    case "REPS":
      return formatReps;
    case "DURATION":
      return formatSetDuration;
    case "WEIGHT":
      return type === "WEIGHTED_BODYWEIGHT" ? formatPlusKg : formatKg;
    default:
      return formatKg;
  }
}

function recordValue(
  record: ExerciseRecord | null,
  format: (value: number) => string,
): string {
  return record ? format(record.value) : "–";
}

function recordRows(stats: ExerciseStats): { label: string; value: string }[] {
  const type = stats.trackingType ?? DEFAULT_TRACKING_TYPE;

  const volumeRows = [
    {
      label: "Legjobb szett volumen",
      value: recordValue(stats.bestSetVolume, formatVolumeKg),
    },
    {
      label: "Legjobb edzés volumen",
      value: recordValue(stats.bestSessionVolume, formatVolumeKg),
    },
  ];
  const mostRepsRow = {
    label: "Legtöbb ismétlés",
    value: recordValue(stats.mostReps, formatReps),
  };

  switch (type) {
    case "BODYWEIGHT":
      return [mostRepsRow, ...volumeRows];
    case "WEIGHTED_BODYWEIGHT":
      return [
        {
          label: "Legnagyobb plusz súly",
          value: recordValue(stats.heaviestWeight, formatPlusKg),
        },
        mostRepsRow,
        ...volumeRows,
      ];
    case "DURATION":
      return [
        {
          label: "Leghosszabb idő",
          value: recordValue(stats.longestDuration, formatSetDuration),
        },
      ];
    default:
      return [
        {
          label: "Legnehezebb súly",
          value: recordValue(stats.heaviestWeight, formatKg),
        },
        {
          label: "Becsült 1RM",
          value: recordValue(stats.bestOneRepMax, formatKg),
        },
        ...volumeRows,
      ];
  }
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [metric, setMetric] = useState<ChartMetric>("WEIGHT");

  const trackingType = stats?.trackingType ?? DEFAULT_TRACKING_TYPE;
  const options = metricOptions(trackingType);

  const chartPoints = useMemo<ProgressPoint[]>(() => {
    if (!stats) return [];
    return stats.history.map((session) => ({
      time: new Date(session.startTime).getTime(),
      value: metricValue(session, metric),
    }));
  }, [stats, metric]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const data = await exerciseService.getExerciseStats(Number(id));
        if (isActive) {
          setStats(data);
          setMetric(
            metricOptions(data.trackingType ?? DEFAULT_TRACKING_TYPE)[0].value,
          );
        }
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
              unit={METRIC_UNITS[metric]}
              formatTick={tickFormatter(metric)}
              formatValue={valueFormatter(metric, trackingType)}
            />

            {options.length > 1 && (
              <View style={styles.filters}>
                <FilterChips
                  options={options}
                  selected={metric}
                  onSelect={setMetric}
                />
              </View>
            )}

            <Text style={styles.sectionTitle}>REKORDOK</Text>
            <StatRows rows={recordRows(stats)} />
          </>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title={stats?.exerciseName ?? ""}
        onBack={() => router.back()}
      />

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
