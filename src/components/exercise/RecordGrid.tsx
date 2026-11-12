import { ExerciseRecord } from "@/api/exerciseService";
import { useLocale } from "@/i18n/useLocale";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface RecordItem {
  label: string;
  record: ExerciseRecord | null;
  format: (value: number) => string;
}

function formatRecordDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RecordGrid({
  items,
  onPressRecord,
}: {
  items: RecordItem[];
  onPressRecord?: (workoutId: number) => void;
}) {
  const { t, locale } = useLocale();

  return (
    <View>
      {items.map((item) => {
        const record = item.record;
        const isPressable = record !== null && onPressRecord !== undefined;

        return (
          <TouchableOpacity
            key={item.label}
            style={styles.card}
            disabled={!isPressable}
            onPress={() => record && onPressRecord?.(record.workoutId)}
          >
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>
              {record ? item.format(record.value) : "-"}
            </Text>
            <Text style={styles.date}>
              {record ? formatRecordDate(record.date, locale) : t("common.noData")}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 14,
  },
  label: { color: "#8E8E93", fontSize: 12, fontWeight: "600" },
  value: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  date: { color: "#8E8E93", fontSize: 12, marginTop: 4 },
});
