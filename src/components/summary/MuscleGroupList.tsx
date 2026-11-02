import { MUSCLE_GROUP_LABELS } from "@/utils/muscleGroups";
import { MuscleGroupSets } from "@/utils/strengthAnalysis";
import { StyleSheet, Text, View } from "react-native";

export function MuscleGroupList({ items }: { items: MuscleGroupSets[] }) {
  if (items.length === 0) return null;

  const maxSets = items[0].sets;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IZOMCSOPORTOK</Text>
      {items.map((item, index) => {
        const ratio = item.sets / maxSets;
        const isTop = index === 0;

        return (
          <View key={item.group} style={styles.row}>
            <Text style={styles.label}>{MUSCLE_GROUP_LABELS[item.group]}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { width: `${Math.max(ratio * 100, 4)}%` },
                  isTop && styles.barTop,
                ]}
              />
            </View>
            <Text style={styles.value}>{item.sets} szett</Text>
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
