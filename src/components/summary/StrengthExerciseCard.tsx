import type {
  ExerciseSetDetail,
  WorkoutExerciseDetail,
} from "@/api/workoutService";
import { rankLabel } from "@/utils/rankLabel";
import {
  exerciseTrackingType,
  exerciseVolume,
  findBestSet,
} from "@/utils/strengthAnalysis";
import type { TrackingType } from "@/utils/trackingTypes";
import {
  formatSetDuration,
  formatVolume,
  formatWeight,
} from "@/utils/workoutFormat";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

interface Column {
  label: string;
  width: number;
  render: (set: ExerciseSetDetail) => string;
}

const repsColumn = (width: number, t: TFunction): Column => ({
  label: t("setColumns.reps"),
  width,
  render: (set) => `${set.reps}`,
});

function columnsFor(type: TrackingType, t: TFunction): Column[] {
  switch (type) {
    case "BODYWEIGHT":
      return [repsColumn(90, t)];
    case "WEIGHTED_BODYWEIGHT":
      return [
        {
          label: t("setColumns.plusWeight"),
          width: 90,
          render: (set) => `+${formatWeight(set.weight)} kg`,
        },
        repsColumn(50, t),
      ];
    case "DURATION":
      return [
        {
          label: t("setColumns.time"),
          width: 90,
          render: (set) => formatSetDuration(set.durationSeconds ?? 0),
        },
      ];
    default:
      return [
        {
          label: t("setColumns.weight"),
          width: 90,
          render: (set) => `${formatWeight(set.weight)} kg`,
        },
        repsColumn(50, t),
      ];
  }
}

export function StrengthExerciseCard({
  exercise,
  bodyWeightKg,
}: {
  exercise: WorkoutExerciseDetail;
  bodyWeightKg: number | null;
}) {
  const { t } = useTranslation();
  const type = exerciseTrackingType(exercise);
  const sets = exercise.sets;
  const columns = columnsFor(type, t);
  const bestSet = findBestSet(type, sets);

  const headerValue =
    type === "DURATION"
      ? formatSetDuration(
          sets.reduce((sum, set) => sum + (set.durationSeconds ?? 0), 0),
        )
      : `${formatVolume(exerciseVolume(exercise, bodyWeightKg))} kg`;

  const recordLabel = rankLabel(exercise.weightRank, t);
  const isRecord = exercise.weightRank === 1;
  const bestLabel =
    recordLabel ?? (sets.length > 1 ? t("rank.best") : null);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{exercise.exerciseName}</Text>
        <Text style={styles.volume}>{headerValue}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.headerText, styles.setColumn]}>
          {t("setColumns.set")}
        </Text>
        {columns.map((column) => (
          <Text
            key={column.label}
            style={[styles.headerText, { width: column.width }]}
          >
            {column.label}
          </Text>
        ))}
        <View style={styles.badgeColumn} />
      </View>

      {sets.map((set) => {
        const label = set.id === bestSet?.id ? bestLabel : null;
        const highlight = label !== null;

        return (
          <View key={set.id} style={[styles.row, styles.setRow]}>
            <Text
              style={[styles.cell, styles.setColumn, highlight && styles.best]}
            >
              {set.setNumber}
            </Text>
            {columns.map((column) => (
              <Text
                key={column.label}
                style={[
                  styles.cell,
                  { width: column.width },
                  highlight && styles.best,
                ]}
              >
                {column.render(set)}
              </Text>
            ))}
            <View style={styles.badgeColumn}>
              {label && (
                <View
                  style={[
                    styles.badge,
                    recordLabel &&
                      (isRecord ? styles.badgeRecord : styles.badgeRank),
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      recordLabel && !isRecord && styles.badgeTextRank,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  name: { color: "#FFF", fontSize: 17, fontWeight: "700", flexShrink: 1 },
  volume: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 12,
    fontVariant: ["tabular-nums"],
  },
  row: { flexDirection: "row", alignItems: "center" },
  setRow: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
  },
  headerText: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    paddingBottom: 6,
  },
  cell: { color: "#FFF", fontSize: 15, fontVariant: ["tabular-nums"] },
  setColumn: { width: 52 },
  badgeColumn: { flex: 1, alignItems: "flex-end" },
  best: { color: "#FC4C02", fontWeight: "700" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeRecord: { backgroundColor: "rgba(252, 76, 2, 0.18)" },
  badgeRank: { backgroundColor: "#2C2C2E" },
  badgeText: { color: "#FC4C02", fontSize: 11, fontWeight: "700" },
  badgeTextRank: { color: "#AEAEB2" },
});
