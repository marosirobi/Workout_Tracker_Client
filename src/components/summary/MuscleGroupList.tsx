import { muscleGroupLabel } from "@/utils/muscleGroups";
import { MuscleGroupSets } from "@/utils/strengthAnalysis";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export function MuscleGroupList({ items }: { items: MuscleGroupSets[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  const maxSets = items[0].sets;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("workoutDetail.muscleGroups")}</Text>
      {items.map((item, index) => {
        const ratio = item.sets / maxSets;
        const isTop = index === 0;

        return (
          <View key={item.group} style={styles.row}>
            <Text style={styles.label}>{muscleGroupLabel(item.group, t)}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { width: `${Math.max(ratio * 100, 4)}%` },
                  isTop && styles.barTop,
                ]}
              />
            </View>
            <Text style={styles.value}>
              {t("units.sets", { count: item.sets })}
            </Text>
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
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 7 },
  label: { color: "#FFF", fontSize: 15, width: 80 },
  barTrack: { flex: 1, height: 10, marginHorizontal: 8 },
  bar: { height: 10, borderRadius: 5, backgroundColor: "#48484A" },
  barTop: { backgroundColor: "#FC4C02" },
  value: {
    color: "#8E8E93",
    fontSize: 13,
    width: 60,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
});
