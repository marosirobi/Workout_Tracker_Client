import { IconButton } from "@/components/IconButton";
import { MUSCLE_GROUP_LABELS, MuscleGroup } from "@/utils/muscleGroups";
import { StyleSheet, Text, View } from "react-native";

export interface TempExercise {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: MuscleGroup | null;
  targetSets: number;
}

interface TempExerciseProps {
  exercise: TempExercise;
  isFirst: boolean;
  isLast: boolean;
  minSets: number;
  maxSets: number;
  onChangeSets: (delta: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function TemplateExerciseRow({
  exercise,
  isFirst,
  isLast,
  minSets,
  maxSets,
  onChangeSets,
  onMoveUp,
  onMoveDown,
  onRemove,
}: TempExerciseProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.texts}>
          <Text style={styles.name} numberOfLines={1}>
            {exercise.exerciseName}
          </Text>
          {exercise.muscleGroup && (
            <Text style={styles.group}>
              {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
            </Text>
          )}
        </View>
        <IconButton name="trash-outline" color="#FF453A" onPress={onRemove} />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.stepper}>
          <IconButton
            name="remove"
            onPress={() => onChangeSets(-1)}
            disabled={exercise.targetSets <= minSets}
          />
          <Text style={styles.sets}>{exercise.targetSets} szett</Text>
          <IconButton
            name="add"
            onPress={() => onChangeSets(1)}
            disabled={exercise.targetSets >= maxSets}
          />
        </View>

        <View style={styles.arrows}>
          <IconButton name="chevron-up" onPress={onMoveUp} disabled={isFirst} />
          <IconButton
            name="chevron-down"
            onPress={onMoveDown}
            disabled={isLast}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  texts: { flex: 1, marginRight: 12 },
  name: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  group: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  sets: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
    minWidth: 64,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  arrows: { flexDirection: "row", gap: 6 },
});
