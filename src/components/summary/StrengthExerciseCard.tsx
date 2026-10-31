import type { WorkoutExerciseDetail } from "@/api/workoutService";
import { rankLabel } from "@/utils/rankLabel";
import { findBestSet, setVolume } from "@/utils/strengthAnalysis";
import { formatVolume, formatWeight } from "@/utils/workoutFormat";
import { StyleSheet, Text, View } from "react-native";

export function StrengthExerciseCard({
  exercise,
}: {
  exercise: WorkoutExerciseDetail;
}) {
  const sets = exercise.sets;
  const bestSet = findBestSet(sets);
  const volume = sets.reduce((sum, set) => sum + setVolume(set), 0);

  const recordLabel = rankLabel(exercise.weightRank);
  const isRecord = exercise.weightRank === 1;
  const bestLabel = recordLabel ?? (sets.length > 1 ? "Legjobb" : null);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{exercise.exerciseName}</Text>
        <Text style={styles.volume}>{formatVolume(volume)} kg</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.headerText, styles.setColumn]}>SZETT</Text>
        <Text style={[styles.headerText, styles.weightColumn]}>SÚLY</Text>
        <Text style={[styles.headerText, styles.repsColumn]}>ISM.</Text>
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
            <Text
              style={[
                styles.cell,
                styles.weightColumn,
                highlight && styles.best,
              ]}
            >
              {formatWeight(set.weight)} kg
            </Text>
            <Text
              style={[styles.cell, styles.repsColumn, highlight && styles.best]}
            >
              {set.reps}
            </Text>
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
  weightColumn: { width: 90 },
  repsColumn: { width: 50 },
  badgeColumn: { flex: 1, alignItems: "flex-end" },
  best: { color: "#FC4C02", fontWeight: "700" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeRecord: { backgroundColor: "rgba(252, 76, 2, 0.18)" },
  badgeRank: { backgroundColor: "#2C2C2E" },
  badgeText: { color: "#FC4C02", fontSize: 11, fontWeight: "700" },
  badgeTextRank: { color: "#AEAEB2" },
});
