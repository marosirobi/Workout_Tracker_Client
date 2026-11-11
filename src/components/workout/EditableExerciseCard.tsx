import type { MuscleGroup } from "@/utils/muscleGroups";
import { sanitizeDuration } from "@/utils/durationInput";
import { sanitizeDecimal, sanitizeInteger } from "@/utils/numberInput";
import {
  usesReps,
  usesWeight,
  type TrackingType,
} from "@/utils/trackingTypes";
import { Ionicons } from "@expo/vector-icons";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export interface DraftSet {
  key: string;
  weight: string;
  reps: string;
  duration: string;
}

export interface DraftWorkoutExercise {
  key: string;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: MuscleGroup | null;
  trackingType: TrackingType;
  sets: DraftSet[];
}

export type SetField = "weight" | "reps" | "duration";

const weightHeader = (type: TrackingType) =>
  type === "WEIGHTED_BODYWEIGHT" ? "PLUSZ SÚLY (KG)" : "SÚLY (KG)";

interface EditableExerciseCardProps {
  exercise: DraftWorkoutExercise;
  disabled: boolean;
  onChangeSet: (setIndex: number, field: SetField, value: string) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onRemove: () => void;
}

export function EditableExerciseCard({
  exercise,
  disabled,
  onChangeSet,
  onAddSet,
  onRemoveSet,
  onRemove,
}: EditableExerciseCardProps) {
  const canRemoveSet = exercise.sets.length > 1;
  const type = exercise.trackingType;
  const isDuration = type === "DURATION";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {exercise.exerciseName}
        </Text>
        <TouchableOpacity onPress={onRemove} disabled={disabled} hitSlop={10}>
          <Ionicons name="trash-outline" size={20} color="#FF453A" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={[styles.headerText, styles.setColumn]}>SZETT</Text>
        {usesWeight(type) && (
          <Text style={[styles.headerText, styles.inputColumn]}>
            {weightHeader(type)}
          </Text>
        )}
        {usesReps(type) && (
          <Text style={[styles.headerText, styles.inputColumn]}>ISM.</Text>
        )}
        {isDuration && (
          <Text style={[styles.headerText, styles.inputColumn]}>
            IDŐ (P:MP)
          </Text>
        )}
        <View style={styles.deleteColumn} />
      </View>

      {exercise.sets.map((set, index) => (
        <View key={set.key} style={[styles.row, styles.setRow]}>
          <Text style={[styles.setNumber, styles.setColumn]}>{index + 1}</Text>

          {usesWeight(type) && (
            <TextInput
              style={[styles.input, styles.inputColumn]}
              value={set.weight}
              onChangeText={(text) =>
                onChangeSet(index, "weight", sanitizeDecimal(text))
              }
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#5A5A5E"
              maxLength={7}
              editable={!disabled}
            />
          )}

          {usesReps(type) && (
            <TextInput
              style={[styles.input, styles.inputColumn]}
              value={set.reps}
              onChangeText={(text) =>
                onChangeSet(index, "reps", sanitizeInteger(text))
              }
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#5A5A5E"
              maxLength={4}
              editable={!disabled}
            />
          )}

          {isDuration && (
            <TextInput
              style={[styles.input, styles.inputColumn]}
              value={set.duration}
              onChangeText={(text) =>
                onChangeSet(index, "duration", sanitizeDuration(text))
              }
              keyboardType="numbers-and-punctuation"
              placeholder="0:00"
              placeholderTextColor="#5A5A5E"
              maxLength={6}
              editable={!disabled}
            />
          )}

          <TouchableOpacity
            style={styles.deleteColumn}
            onPress={() => onRemoveSet(index)}
            disabled={disabled || !canRemoveSet}
            hitSlop={8}
          >
            <Ionicons
              name="close-circle-outline"
              size={22}
              color={canRemoveSet ? "#8E8E93" : "#3A3A3C"}
            />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addSet}
        onPress={onAddSet}
        disabled={disabled}
      >
        <Text style={styles.addSetText}>+ Szett</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    flexShrink: 1,
    marginRight: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  setRow: { paddingVertical: 6 },
  headerText: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  setColumn: { width: 40 },
  inputColumn: { flex: 1 },
  deleteColumn: { width: 28, alignItems: "center" },
  setNumber: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  input: {
    backgroundColor: "#2C2C2E",
    color: "#FFF",
    fontSize: 16,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  addSet: { alignItems: "center", paddingTop: 12 },
  addSetText: { color: "#FC4C02", fontSize: 15, fontWeight: "700" },
});
