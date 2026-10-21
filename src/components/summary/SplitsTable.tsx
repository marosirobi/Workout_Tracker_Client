import type { Split } from "@/utils/workoutAnalysis";
import { formatPace } from "@/utils/workoutFormat";
import { StyleSheet, Text, View } from "react-native";

export function SplitsTable({ splits }: { splits: Split[] }) {
  if (splits.length === 0) return null;

  const fastestPace = Math.min(...splits.map((s) => s.pacedMinPerKm));
  const maxSpeed = 1 / fastestPace;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RÉSZIDŐK</Text>

      <View style={styles.headerRow}>
        <Text style={[styles.headerText, styles.kmColumn]}>KM</Text>
        <Text style={[styles.headerText, styles.paceColumn]}>TEMPÓ</Text>
      </View>

      {splits.map((split) => {
        const isFastest = split.pacedMinPerKm === fastestPace;
        const isPartial = split.distanceKm < 1;
        const barRatio = 1 / split.pacedMinPerKm / maxSpeed;

        return (
          <View key={split.index} style={styles.row}>
            <Text style={[styles.cellText, styles.kmColumn]}>
              {isPartial ? split.distanceKm.toFixed(2) : split.index}
            </Text>
            <Text style={[styles.cellText, styles.paceColumn]}>
              {formatPace(split.pacedMinPerKm)}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { width: `${Math.max(barRatio * 100, 4)}%` },
                  isFastest && styles.barFastest,
                ]}
              />
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
    marginBottom: 10,
  },
  headerRow: { flexDirection: "row", paddingBottom: 6 },
  headerText: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 7 },
  kmColumn: { width: 48 },
  paceColumn: { width: 56 },
  cellText: { color: "#FFF", fontSize: 15, fontVariant: ["tabular-nums"] },
  barTrack: { flex: 1, height: 10, marginLeft: 8 },
  bar: { height: 10, borderRadius: 5, backgroundColor: "#48484A" },
  barFastest: { backgroundColor: "#FC4C02" },
});
