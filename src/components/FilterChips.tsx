import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: FilterOption<T>[];
  selected: T;
  horizontalPadding?: number;
  onSelect: (value: T) => void;
}

export function FilterChips<T extends string>({
  options,
  selected,
  horizontalPadding = 0,
  onSelect,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.row,
        { paddingHorizontal: horizontalPadding },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => {
        const isActive = option.value === selected;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  chipActive: { backgroundColor: "#FC4C02", borderColor: "#FC4C02" },
  text: { color: "#AEAEB2", fontSize: 14, fontWeight: "600" },
  textActive: { color: "#FFF" },
});
