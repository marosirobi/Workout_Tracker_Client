import {
  workoutService,
  type WorkoutDetailResponse,
} from "@/api/workoutService";
import { BestEfforts } from "@/components/summary/BestEfforts";
import { useLocale } from "@/i18n/useLocale";
import { KeyStats } from "@/components/summary/KeyStats";
import { MuscleGroupList } from "@/components/summary/MuscleGroupList";
import { PaceChart } from "@/components/summary/PaceChart";
import { RouteMap } from "@/components/summary/RouteMap";
import { SplitsTable } from "@/components/summary/SplitsTable";
import { StatRows } from "@/components/summary/StatRows";
import { StrengthExerciseCard } from "@/components/summary/StrengthExerciseCard";
import {
  computeMuscleGroupSets,
  computeStrengthSummary,
} from "@/utils/strengthAnalysis";
import {
  computeCardioSummary,
  computePaceSeries,
  computeSplits,
} from "@/utils/workoutAnalysis";
import {
  formatDuration,
  formatKm,
  formatPace,
  formatSpeed,
  formatVolume,
  formatWeight,
} from "@/utils/workoutFormat";
import { logger } from "@/utils/logger";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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

function formatWorkoutDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WorkoutDetailsScreen() {
  const { t, locale } = useLocale();
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const isFresh = fresh === "1";
  const router = useRouter();

  const [workout, setWorkout] = useState<WorkoutDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const close = useCallback(() => {
    if (isFresh) {
      router.replace("/");
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

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchWorkout = async () => {
        try {
          const data = await workoutService.getWorkoutById(Number(id));
          if (isActive) setWorkout(data);
        } catch (error) {
          logger.error("Hiba a részletek letöltésekor", error);
          if (isActive) {
            Alert.alert(t("common.error"), t("workoutDetail.loadFailed"));
            close();
          }
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchWorkout();
      return () => {
        isActive = false;
      };
    }, [id, close, t]),
  );

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

  const strengthSummary = useMemo(
    () =>
      workout?.type === "STRENGTH" ? computeStrengthSummary(workout) : null,
    [workout],
  );

  const muscleGroupSets = useMemo(
    () =>
      workout?.type === "STRENGTH"
        ? computeMuscleGroupSets(workout.exercises ?? [])
        : [],
    [workout],
  );

  const handleDelete = () => {
    Alert.alert(t("common.delete"), t("workoutDetail.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await workoutService.deleteWorkout(Number(id));
            router.replace("/");
          } catch {
            Alert.alert(t("common.error"), t("workoutDetail.deleteFailed"));
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

  const typeLabel = t(`workoutType.${workout.type}`);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={close} hitSlop={12}>
          <Text style={styles.topBarAction}>
            {isFresh ? t("common.done") : t("common.back")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/workouts/${workout.id}/edit`)}
          hitSlop={12}
        >
          <Text style={styles.topBarAction}>{t("common.edit")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {workout.type === "CARDIO" && (
          <RouteMap points={workout.trackPoints ?? []} />
        )}
        <View style={styles.body}>
          {isFresh && (
            <Text style={styles.congrats}>{t("workoutDetail.congrats")}</Text>
          )}

          <Text style={styles.title}>{workout.workoutTitle || typeLabel}</Text>
          <Text style={styles.meta}>
            {formatWorkoutDate(workout.startTime, locale)} · {typeLabel}
          </Text>
          {workout.workoutNote ? (
            <Text style={styles.note}>{workout.workoutNote}</Text>
          ) : null}

          {summary && (
            <View style={styles.section}>
              <KeyStats
                items={[
                  {
                    label: t("stats.distance"),
                    value: formatKm(summary.distanceKm, locale),
                    unit: "km",
                  },
                  {
                    label: t("stats.avgPace"),
                    value: formatPace(summary.avgPaceMinPerKm),
                    unit: "/km",
                  },
                  {
                    label: t("stats.movingTime"),
                    value: formatDuration(summary.movingSeconds),
                  },
                ]}
              />
              <StatRows
                rows={[
                  {
                    label: t("stats.elapsedTime"),
                    value: formatDuration(summary.elapsedSeconds),
                  },
                  {
                    label: t("stats.avgSpeed"),
                    value: `${formatSpeed(summary.avgSpeedKmh, locale)} km/h`,
                  },
                  {
                    label: t("stats.maxSpeed"),
                    value: `${formatSpeed(summary.maxSpeedKmh, locale)} km/h`,
                  },
                  {
                    label: t("stats.elevationGain"),
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

          {strengthSummary && (
            <View style={styles.section}>
              <KeyStats
                items={[
                  {
                    label: t("stats.duration"),
                    value: formatDuration(strengthSummary.durationSeconds),
                  },
                  {
                    label: t("stats.volume"),
                    value: formatVolume(strengthSummary.totalVolumeKg, locale),
                    unit: "kg",
                  },
                  {
                    label: t("stats.sets"),
                    value: `${strengthSummary.totalSets}`,
                  },
                ]}
              />
              <StatRows
                rows={[
                  {
                    label: t("stats.reps"),
                    value: `${strengthSummary.totalReps}`,
                  },
                  {
                    label: t("stats.exercises"),
                    value: `${strengthSummary.exerciseCount}`,
                  },
                  ...(strengthSummary.heaviestWeightKg !== null
                    ? [
                        {
                          label: t("stats.heaviestWeight"),
                          value: `${formatWeight(strengthSummary.heaviestWeightKg, locale)} kg`,
                        },
                      ]
                    : []),
                ]}
              />
              <MuscleGroupList items={muscleGroupSets} />

              <Text style={styles.sectionTitle}>
                {t("workoutDetail.exercises")}
              </Text>
              {(workout?.exercises ?? []).map((exercise) => (
                <StrengthExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  bodyWeightKg={workout?.bodyWeightKg ?? null}
                />
              ))}
            </View>
          )}

          {workout.type === "STRENGTH" &&
            (workout.exercises?.length ?? 0) > 0 && (
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() =>
                  router.push({
                    pathname: "/templates/[id]",
                    params: { id: "new", fromWorkout: String(workout.id) },
                  })
                }
              >
                <Text style={styles.templateButtonText}>
                  {t("workoutDetail.saveAsTemplate")}
                </Text>
              </TouchableOpacity>
            )}

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>{t("workoutDetail.delete")}</Text>
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
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
  sectionTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 10,
  },
  templateButton: {
    borderWidth: 1,
    borderColor: "#FC4C02",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 28,
  },
  templateButtonText: { color: "#FC4C02", fontSize: 16, fontWeight: "700" },
});
