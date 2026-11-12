import { BestEffortResponse } from "@/api/workoutService";
import { rankLabel } from "@/utils/rankLabel";
import { formatDuration } from "@/utils/workoutFormat";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export function BestEfforts({ efforts }: { efforts: BestEffortResponse[] }) {
  const { t } = useTranslation();
  if (efforts.length === 0) return null;

  const distanceLabels: Record<number, string> = {
    400: "400 m",
    1000: "1 km",
    1609: t("workoutDetail.mile"),
    5000: "5 km",
    10000: "10 km",
    21098: t("workoutDetail.halfMarathon"),
    42195: t("workoutDetail.marathon"),
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("workoutDetail.bestEfforts")}</Text>

      {efforts.map((effort) => {
        const label = rankLabel(effort.rank, t);
        const isRecord = effort.rank === 1;

        return (
          <View key={effort.distanceMeters} style={styles.row}>
            <Text style={styles.distance}>
              {distanceLabels[effort.distanceMeters] ??
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
