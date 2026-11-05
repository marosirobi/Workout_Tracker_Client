import { WorkoutSummary } from "@/api/workoutService";
import {
    formatDuration,
    formatPace,
    formatVolume,
    getAvgPaceMinutes,
} from "@/utils/workoutFormat";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CardStat {
  label: string;
  value: string;
}

function formatCardDate(date: string): string {
  return new Date(date).toLocaleString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildStats(item: WorkoutSummary): CardStat[] {
  const seconds = item.movingTimeSeconds ?? item.durationSeconds ?? 0;

  if (item.type === "CARDIO") {
    const km = item.totalDistance ?? 0;
    return [
      { label: "Táv", value: `${km.toFixed(2)} km` },
      {
        label: "Tempó",
        value: `${formatPace(getAvgPaceMinutes(seconds, km))} /km`,
      },
      {
        label: "Idő",
        value: formatDuration(seconds),
      },
    ];
  }

  return [
    { label: "Idő", value: formatDuration(seconds) },
    { label: "Volumen", value: `${formatVolume(item.totalVolume ?? 0)} kg` },
    { label: "Szettek", value: `${item.totalSets ?? 0}` },
  ];
}

export function WorkoutCard({
  item,
  onPress,
}: {
  item: WorkoutSummary;
  onPress: () => void;
}) {
  const stats = buildStats(item);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.type}>
          {item.type === "CARDIO" ? "KARDIÓ" : "ERŐEDZÉS"}
        </Text>
      </View>
      <Text style={styles.date}>{formatCardDate(item.startTime)}</Text>

      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#FFF", fontSize: 17, fontWeight: "700", flexShrink: 1 },
  type: {
    color: "#FC4C02",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginLeft: 12,
  },
  date: { color: "#8E8E93", fontSize: 13, marginTop: 2 },
  stats: { flexDirection: "row", marginTop: 14 },
  stat: { flex: 1 },
  statLabel: { color: "#8E8E93", fontSize: 12, marginBottom: 2 },
  statValue: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
