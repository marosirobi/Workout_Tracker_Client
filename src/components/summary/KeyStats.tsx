import { StyleSheet, Text, View } from "react-native";

export interface KeyStatItem {
  label: string;
  value: string;
  unit?: string;
}

export function KeyStats({ items }: { items: KeyStatItem[] }) {
  return (
    <View style={styles.row}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[styles.cell, index > 0 && styles.cellDivider]}
        >
          <Text style={styles.label}>{item.label.toUpperCase()}</Text>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {item.value}
            {item.unit ? <Text style={styles.unit}> {item.unit}</Text> : null}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#2A2A2A",
  },
  cell: { flex: 1, paddingHorizontal: 10 },
  cellDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "#2A2A2A",
  },
  label: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  value: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  unit: { color: "#8E8E93", fontSize: 13, fontWeight: "600" },
});
