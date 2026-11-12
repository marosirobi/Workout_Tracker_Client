import type { Exercise } from "@/api/exerciseService";
import { MuscleGroup } from "@/utils/muscleGroups";
import { useTranslation } from "react-i18next";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExerciseBrowser } from "./ExerciseBrowser";

type Filter = MuscleGroup | "ALL";

interface ExercisePickerProps {
  visible: boolean;
  exercises: Exercise[];
  addedIds: number[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  onInfo?: (exercise: Exercise) => void;
}

export function ExercisePicker({
  visible,
  exercises,
  addedIds,
  onSelect,
  onClose,
  onInfo,
}: ExercisePickerProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("exercisePicker.title")}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.headerAction}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>

        <ExerciseBrowser
          exercises={exercises}
          addedIds={addedIds}
          onSelect={onSelect}
          onInfo={onInfo}
        />
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
});
