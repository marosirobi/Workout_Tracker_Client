import type { Exercise } from "@/api/exerciseService";
import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_ORDER,
  MuscleGroup,
} from "@/utils/muscleGroups";
import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Filter = MuscleGroup | "ALL";

interface ExercisePickerProps {
  visible: boolean;
  exercises: Exercise[];
  addedIds: number[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({
  visible,
  exercises,
  addedIds,
  onSelect,
  onClose,
}: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();

    return MUSCLE_GROUP_ORDER.filter(
      (group) => filter === "ALL" || group === filter,
    )
      .map((group) => ({
        group,
        title: MUSCLE_GROUP_LABELS[group],
        data: exercises
          .filter(
            (ex) =>
              ex.muscleGroup === group &&
              ex.exerciseName.toLowerCase().includes(q),
          )
          .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)),
      }))
      .filter((section) => section.data.length > 0);
  }, [exercises, query, filter]);

  const reset = () => {
    setQuery("");
    setFilter("ALL");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelect = (exercise: Exercise) => {
    reset();
    onSelect(exercise);
  };

  const filters: Filter[] = ["ALL", ...MUSCLE_GROUP_ORDER];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Válassz gyakorlatot</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={12}>
            <Text style={styles.headerAction}>Mégse</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Keresés..."
          placeholderTextColor="#5A5A5E"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            keyboardShouldPersistTaps="handled"
          >
            {filters.map((f) => {
              const isActive = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text
                    style={[styles.chipText, isActive && styles.chipTextActive]}
                  >
                    {f === "ALL" ? "Mind" : MUSCLE_GROUP_LABELS[f]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>
              {section.title.toUpperCase()}
            </Text>
          )}
          renderItem={({ item }) => {
            const isAdded = addedIds.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.row, isAdded && styles.rowDisabled]}
                onPress={() => handleSelect(item)}
                disabled={isAdded}
              >
                <Text style={styles.rowName}>{item.exerciseName}</Text>
                {isAdded && <Text style={styles.rowBadge}>Hozzáadva</Text>}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Nincs ilyen gyakorlat</Text>
          }
        ></SectionList>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  headerAction: { color: "#FC4C02", fontSize: 16, fontWeight: "600" },
  search: {
    marginHorizontal: 20,
    backgroundColor: "#1E1E1E",
    color: "#FFF",
    fontSize: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  chips: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  chipActive: { backgroundColor: "#FC4C02", borderColor: "#FC4C02" },
  chipText: { color: "#AEAEB2", fontSize: 14, fontWeight: "600" },
  chipTextActive: { color: "#FFF" },
  listContent: { paddingBottom: 40 },
  sectionHeader: {
    color: "#8E8E92",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2A",
  },
  rowDisabled: { opacity: 0.4 },
  rowName: { color: "#FFF", fontSize: 16 },
  rowBadge: { color: "#8E8E93", fontSize: 12, fontWeight: "600" },
  empty: {
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },
});
