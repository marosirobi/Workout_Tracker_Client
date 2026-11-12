import type { Exercise } from "@/api/exerciseService";
import { FilterChips, type FilterOption } from "@/components/FilterChips";
import {
    MUSCLE_GROUP_ORDER,
    muscleGroupLabel,
    type MuscleGroup,
} from "@/utils/muscleGroups";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Filter = MuscleGroup | "ALL";

interface ExerciseBrowserPrompt {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  addedIds?: number[];
  onInfo?: (exercise: Exercise) => void;
  showChevron?: boolean;
}

export function ExerciseBrowser({
  exercises,
  onSelect,
  addedIds,
  onInfo,
  showChevron = false,
}: ExerciseBrowserPrompt) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filterOptions = useMemo<FilterOption<Filter>[]>(
    () => [
      { value: "ALL", label: t("common.all") },
      ...MUSCLE_GROUP_ORDER.map((group) => ({
        value: group,
        label: muscleGroupLabel(group, t),
      })),
    ],
    [t],
  );
  const [filter, setFilter] = useState<Filter>("ALL");

  const section = useMemo(() => {
    const q = query.trim().toLowerCase();

    return MUSCLE_GROUP_ORDER.filter(
      (group) => filter === "ALL" || filter === group,
    )
      .map((group) => ({
        group,
        title: muscleGroupLabel(group, t),
        data: exercises
          .filter(
            (ex) =>
              ex.muscleGroup === group &&
              ex.exerciseName.toLowerCase().includes(q),
          )
          .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)),
      }))
      .filter((sect) => sect.data.length > 0);
  }, [exercises, query, filter, t]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder={t("exercisePicker.search")}
        placeholderTextColor="#5A5A5E"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <View style={styles.chips}>
        <FilterChips
          options={filterOptions}
          selected={filter}
          onSelect={setFilter}
          horizontalPadding={20}
        />
      </View>

      <SectionList
        sections={section}
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
          const isAdded = addedIds?.includes(item.id) ?? false;
          return (
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.rowMain, isAdded && styles.rowDisabled]}
                onPress={() => onSelect(item)}
                disabled={isAdded}
              >
                <Text style={styles.rowName}>{item.exerciseName}</Text>
                {isAdded && (
                  <Text style={styles.rowBadge}>{t("exercisePicker.added")}</Text>
                )}
                {showChevron && (
                  <Ionicons name="chevron-forward" size={18} color="#5A5A5E" />
                )}
              </TouchableOpacity>

              {onInfo && (
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => onInfo(item)}
                  hitSlop={8}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>{t("exercisePicker.empty")}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  chips: { paddingVertical: 8 },
  listContent: { paddingBottom: 40 },
  sectionHeader: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2A",
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 14,
  },
  rowDisabled: { opacity: 0.4 },
  rowName: { color: "#FFF", fontSize: 16, flexShrink: 1 },
  rowBadge: { color: "#8E8E93", fontSize: 12, fontWeight: "600" },
  infoButton: { paddingHorizontal: 16, paddingVertical: 12 },
  empty: {
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },
});
