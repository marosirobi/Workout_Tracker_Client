import { StyleSheet, Text, View } from "react-native";

const TOOLTIP_WIDTH = 120;

interface ChartTooltipProps {
  x: number;
  containerWidth: number;
  value: string;
  caption: string;
}

export function ChartTooltip({
  x,
  containerWidth,
  value,
  caption,
}: ChartTooltipProps) {
  const left = Math.min(
    Math.max(x - TOOLTIP_WIDTH / 2, 0),
    Math.max(containerWidth - TOOLTIP_WIDTH, 0),
  );

  return (
    <View pointerEvents="none" style={[styles.tooltip, { left }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    top: 0,
    width: TOOLTIP_WIDTH,
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  value: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  caption: { color: "#AEAEB2", fontSize: 11, marginTop: 1 },
});
