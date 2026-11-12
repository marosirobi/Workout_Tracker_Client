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
import { useLocale } from "@/i18n/useLocale";
import { muscleGroupLabel } from "@/utils/muscleGroups";
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
import type { TFunction } from "i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChartMetric = "WEIGHT" | "ONE_REP_MAX" | "VOLUME" | "REPS" | "DURATION";

function metricOptions(
  type: TrackingType,
  t: TFunction,
): FilterOption<ChartMetric>[] {
  switch (type) {
    case "BODYWEIGHT":
      return [
        { value: "REPS", label: t("exerciseDetail.metricReps") },
        { value: "VOLUME", label: t("exerciseDetail.metricVolume") },
      ];
    case "WEIGHTED_BODYWEIGHT":
      return [
        { value: "WEIGHT", label: t("exerciseDetail.metricPlusWeight") },
        { value: "REPS", label: t("exerciseDetail.metricReps") },
        { value: "VOLUME", label: t("exerciseDetail.metricVolume") },
      ];
    case "DURATION":
      return [{ value: "DURATION", label: t("exerciseDetail.metricTime") }];
    default:
      return [
        { value: "WEIGHT", label: t("exerciseDetail.metricWeight") },
        { value: "ONE_REP_MAX", label: t("exerciseDetail.metricOneRepMax") },
        { value: "VOLUME", label: t("exerciseDetail.metricVolume") },
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

function metricUnit(metric: ChartMetric, t: TFunction): string {
  switch (metric) {
    case "REPS":
      return t("units.reps");
    case "DURATION":
      return t("units.minSec");
    default:
      return "kg";
  }
}

function tickFormatter(
  metric: ChartMetric,
  locale: string,
): (value: number) => string {
  switch (metric) {
    case "VOLUME":
      return (value) => formatVolume(value, locale);
    case "REPS":
      return (value) => `${Math.round(value)}`;
    case "DURATION":
      return formatSetDuration;
    default:
      return (value) => formatWeight(value, locale);
  }
}

const kgFormatter = (locale: string) => (value: number) =>
  `${formatWeight(value, locale)} kg`;
const plusKgFormatter = (locale: string) => (value: number) =>
  `+${formatWeight(value, locale)} kg`;
const volumeKgFormatter = (locale: string) => (value: number) =>
  `${formatVolume(value, locale)} kg`;
const repsFormatter = (t: TFunction) => (value: number) =>
  `${Math.round(value)} ${t("units.reps")}`;

function valueFormatter(
  metric: ChartMetric,
  type: TrackingType,
  t: TFunction,
  locale: string,
): (value: number) => string {
  const formatKg = kgFormatter(locale);
  const formatPlusKg = plusKgFormatter(locale);
  const formatVolumeKg = volumeKgFormatter(locale);
  switch (metric) {
    case "VOLUME":
      return formatVolumeKg;
    case "REPS":
      return repsFormatter(t);
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

function recordRows(
  stats: ExerciseStats,
  t: TFunction,
  locale: string,
): { label: string; value: string }[] {
  const formatKg = kgFormatter(locale);
  const formatPlusKg = plusKgFormatter(locale);
  const formatVolumeKg = volumeKgFormatter(locale);
  const type = stats.trackingType ?? DEFAULT_TRACKING_TYPE;

  const volumeRows = [
    {
      label: t("exerciseDetail.bestSetVolume"),
      value: recordValue(stats.bestSetVolume, formatVolumeKg),
    },
    {
      label: t("exerciseDetail.bestSessionVolume"),
      value: recordValue(stats.bestSessionVolume, formatVolumeKg),
    },
  ];
  const mostRepsRow = {
    label: t("exerciseDetail.mostReps"),
    value: recordValue(stats.mostReps, repsFormatter(t)),
  };

  switch (type) {
    case "BODYWEIGHT":
      return [mostRepsRow, ...volumeRows];
    case "WEIGHTED_BODYWEIGHT":
      return [
        {
          label: t("exerciseDetail.heaviestPlus"),
          value: recordValue(stats.heaviestWeight, formatPlusKg),
        },
        mostRepsRow,
        ...volumeRows,
      ];
    case "DURATION":
      return [
        {
          label: t("exerciseDetail.longest"),
          value: recordValue(stats.longestDuration, formatSetDuration),
        },
      ];
    default:
      return [
        {
          label: t("exerciseDetail.heaviest"),
          value: recordValue(stats.heaviestWeight, formatKg),
        },
        {
          label: t("exerciseDetail.oneRepMax"),
          value: recordValue(stats.bestOneRepMax, formatKg),
        },
        ...volumeRows,
      ];
  }
}

export default function ExerciseDetailScreen() {
  const { t, locale } = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [metric, setMetric] = useState<ChartMetric>("WEIGHT");

  const trackingType = stats?.trackingType ?? DEFAULT_TRACKING_TYPE;
  const options = metricOptions(trackingType, t);

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
            metricOptions(data.trackingType ?? DEFAULT_TRACKING_TYPE, t)[0].value,
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
  }, [id, t]);

  const renderBody = () => {
    if (isLoading) {
      return <ActivityIndicator color="#FC4C02" style={styles.spinner} />;
    }
    if (loadFailed || !stats) {
      return (
        <Text style={styles.muted}>{t("exerciseDetail.loadFailed")}</Text>
      );
    }

    return (
      <>
        <Text style={styles.muscleGroup}>
          {muscleGroupLabel(stats.muscleGroup, t)}
        </Text>

        {stats.history.length === 0 ? (
          <Text style={[styles.muted, styles.centered]}>
            {t("exerciseDetail.neverDone")}
          </Text>
        ) : (
          <>
            <ProgressChart
              points={chartPoints}
              unit={metricUnit(metric, t)}
              formatTick={tickFormatter(metric, locale)}
              formatValue={valueFormatter(metric, trackingType, t, locale)}
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

            <Text style={styles.sectionTitle}>{t("exerciseDetail.records")}</Text>
            <StatRows rows={recordRows(stats, t, locale)} />
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
