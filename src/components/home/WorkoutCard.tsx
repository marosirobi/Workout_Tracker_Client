import { WorkoutSummary } from "@/api/workoutService";
import { useLocale } from "@/i18n/useLocale";
import {
    formatDuration,
    formatPace,
    formatVolume,
    getAvgPaceMinutes,
} from "@/utils/workoutFormat";
import type { TFunction } from "i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CardStat {
  label: string;
  value: string;
}

function formatCardDate(date: string, locale: string): string {
  return new Date(date).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildStats(item: WorkoutSummary, t: TFunction): CardStat[] {
  const seconds = item.movingTimeSeconds ?? item.durationSeconds ?? 0;

  if (item.type === "CARDIO") {
    const km = item.totalDistance ?? 0;
    return [
      { label: t("stats.distance"), value: `${km.toFixed(2)} km` },
      {
        label: t("stats.pace"),
        value: `${formatPace(getAvgPaceMinutes(seconds, km))} /km`,
      },
      {
        label: t("stats.time"),
        value: formatDuration(seconds),
      },
    ];
  }

  return [
    { label: t("stats.time"), value: formatDuration(seconds) },
    {
      label: t("stats.volume"),
      value: `${formatVolume(item.totalVolume ?? 0)} kg`,
    },
    { label: t("stats.sets"), value: `${item.totalSets ?? 0}` },
  ];
}

export function WorkoutCard({
  item,
  onPress,
}: {
  item: WorkoutSummary;
  onPress: () => void;
}) {
  const { t, locale } = useLocale();
  const stats = buildStats(item, t);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.type}>
          {t(`workoutType.${item.type}`).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.date}>{formatCardDate(item.startTime, locale)}</Text>

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
