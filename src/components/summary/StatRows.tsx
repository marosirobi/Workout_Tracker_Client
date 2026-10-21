import { StyleSheet, Text, View } from "react-native";

export interface StatRow {
  label: string;
  value: string;
}

export function StatRows({ rows }: { rows: StatRow[] }) {
  return (
    <View style={styles.container}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[styles.row, index < rows.length - 1 && styles.rowDivider]}
        >
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2A",
  },
  label: { color: "#C7C7CC", fontSize: 15 },
  value: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
