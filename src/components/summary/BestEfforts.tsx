import { BestEffortResponse } from "@/api/workoutService";
import { formatDuration } from "@/utils/workoutFormat";
import { StyleSheet, Text, View } from "react-native";

const DISTANCE_LABELS: Record<number, string> = {
  400: "400 m",
  1000: "1 km",
  1609: "1 mérföld",
  5000: "5 km",
  10000: "10 km",
  21098: "Félmaraton",
  42195: "Maraton",
};

function rankLabel(rank: number): string | null {
  if (rank === 1) return "1. legjobb";
  if (rank === 2) return "2. legjobb";
  if (rank === 3) return "3. legjobb";
  return null;
}

export function BestEfforts({ efforts }: { efforts: BestEffortResponse[] }) {
  if (efforts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LEGJOBB IDŐK</Text>

      {efforts.map((effort) => {
        const label = rankLabel(effort.rank);
        const isRecord = effort.rank === 1;

        return (
          <View key={effort.distanceMeters} style={styles.row}>
            <Text style={styles.distance}>
              {DISTANCE_LABELS[effort.distanceMeters] ??
                `${effort.distanceMeters} m`}
            </Text>

            <View style={styles.right}>
              {label && (
                <View style={[styles.badge, isRecord && styles.badgeRecord]}>
                  <Text
                    style={[
                      styles.badgeText,
                      isRecord && styles.badgeTextRecord,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              )}
              <Text style={styles.time}>
                {formatDuration(Math.round(effort.durationSeconds))}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 28 },
  title: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  distance: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  right: { flexDirection: "row", alignItems: "center", gap: 10 },
  time: {
    color: "#FFF",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    minWidth: 56,
    textAlign: "right",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#2C2C2E",
  },
  badgeRecord: { backgroundColor: "rgba(252, 76, 2, 0.18)" },
  badgeText: { color: "#AEAEB2", fontSize: 11, fontWeight: "700" },
  badgeTextRecord: { color: "#FC4C02" },
});
