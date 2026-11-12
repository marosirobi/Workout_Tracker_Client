import { exerciseService, type Exercise } from "@/api/exerciseService";
import {
  workoutService,
  type EditWorkoutRequest,
  type WorkoutDetailResponse,
} from "@/api/workoutService";
import { EditorHeader } from "@/components/EditorHeader";
import {
  EditableExerciseCard,
  type DraftWorkoutExercise,
  type SetField,
} from "@/components/workout/EditableExerciseCard";
import { ExercisePicker } from "@/components/workout/ExercisePicker";
import i18n from "@/i18n";
import type { WorkoutType } from "@/store/workoutStore";
import { formatDurationInput, parseDurationInput } from "@/utils/durationInput";
import { formatDecimalInput, parseDecimalInput } from "@/utils/numberInput";
import {
  DEFAULT_TRACKING_TYPE,
  usesReps,
  usesWeight,
} from "@/utils/trackingTypes";
import { defaultWorkoutTitle } from "@/utils/workoutDefaults";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_TITLE_LENGTH = 100;
const MAX_NOTE_LENGTH = 255;
const MAX_VALUE = 1000;
const MAX_DURATION_SECONDS = 6 * 60 * 60;

interface Draft {
  title: string;
  note: string;
  exercises: DraftWorkoutExercise[];
}

const EMPTY_DRAFT: Draft = { title: "", note: "", exercises: [] };

let keyCounter = 0;
const newKey = () => `k${keyCounter++}`;

function toDraft(workout: WorkoutDetailResponse): Draft {
  return {
    title: workout.workoutTitle ?? "",
    note: workout.workoutNote ?? "",
    exercises: (workout.exercises ?? []).map((ex) => ({
      key: newKey(),
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      muscleGroup: ex.muscleGroup,
      trackingType: ex.trackingType ?? DEFAULT_TRACKING_TYPE,
      sets: ex.sets.map((set) => ({
        key: newKey(),
        weight: formatDecimalInput(set.weight),
        reps: set.reps > 0 ? String(set.reps) : "",
        duration: formatDurationInput(set.durationSeconds ?? 0),
      })),
    })),
  };
}

function validateExercises(exercises: DraftWorkoutExercise[]): string | null {
  if (exercises.length === 0) {
    return i18n.t("workoutEditor.noExercises");
  }

  for (const exercise of exercises) {
    const type = exercise.trackingType;

    for (let i = 0; i < exercise.sets.length; i++) {
      const set = exercise.sets[i];
      const where = i18n.t("workoutEditor.setRef", {
        name: exercise.exerciseName,
        set: i + 1,
      });

      if (usesWeight(type)) {
        const weight = parseDecimalInput(set.weight);
        if (weight === null || weight > MAX_VALUE) {
          return i18n.t("workoutEditor.invalidWeight", { where });
        }
      }

      if (usesReps(type)) {
        const reps = Number(set.reps);
        if (set.reps === "" || reps < 1 || reps > MAX_VALUE) {
          return i18n.t("workoutEditor.invalidReps", { where });
        }
      }

      if (type === "DURATION") {
        const seconds = parseDurationInput(set.duration);
        if (seconds === null || seconds < 1 || seconds > MAX_DURATION_SECONDS) {
          return i18n.t("workoutEditor.invalidTime", { where });
        }
      }
    }
  }
  return null;
}

function toRequestExercises(
  exercises: DraftWorkoutExercise[],
): EditWorkoutRequest["exercises"] {
  return exercises.map((exercise, exerciseIndex) => {
    const type = exercise.trackingType;

    return {
      exerciseId: exercise.exerciseId,
      orderIndex: exerciseIndex + 1,
      sets: exercise.sets.map((set, setIndex) => ({
        setNumber: setIndex + 1,
        weight: usesWeight(type) ? (parseDecimalInput(set.weight) ?? 0) : 0,
        reps: usesReps(type) ? Number(set.reps) : 0,
        durationSeconds:
          type === "DURATION"
            ? (parseDurationInput(set.duration) ?? 0)
            : undefined,
      })),
    };
  });
}

export default function WorkoutEditorScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();

  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [initialDraft, setInitialDraft] = useState<Draft>(EMPTY_DRAFT);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const isStrength = workoutType === "STRENGTH";

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const workout = await workoutService.getWorkoutById(workoutId);
        if (!isActive) return;

        const loaded = toDraft(workout);
        setWorkoutType(workout.type);
        setDraft(loaded);
        setInitialDraft(loaded);
      } catch (error: any) {
        console.error(
          "Hiba az edzés betöltésekor",
          error.response?.data || error.message,
        );
        if (isActive) {
          Alert.alert(t("common.error"), t("workoutEditor.loadFailed"));
          setIsDone(true);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, [workoutId, t]);

  useEffect(() => {
    if (!isStrength) return;
    exerciseService
      .getAllExercises()
      .then(setCatalog)
      .catch((error) =>
        console.error("Hiba a gyakorlatok betöltésekor", error),
      );
  }, [isStrength]);

  useEffect(() => {
    if (isDone) router.back();
  }, [isDone, router]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialDraft),
    [draft, initialDraft],
  );

  usePreventRemove(isDirty && !isDone, ({ data }) => {
    Alert.alert(
      t("common.discardChangesTitle"),
      t("common.discardChangesMessage"),
      [
        { text: t("common.stay"), style: "cancel" },
        {
          text: t("common.discard"),
          style: "destructive",
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });

  const defaultTitle = workoutType ? defaultWorkoutTitle(workoutType, t) : "";

  const updateExercise = (
    exerciseIndex: number,
    change: (exercise: DraftWorkoutExercise) => DraftWorkoutExercise,
  ) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((ex, i) =>
        i === exerciseIndex ? change(ex) : ex,
      ),
    }));
  };

  const changeSet = (
    exerciseIndex: number,
    setIndex: number,
    field: SetField,
    value: string,
  ) => {
    updateExercise(exerciseIndex, (ex) => ({
      ...ex,
      sets: ex.sets.map((set, i) =>
        i === setIndex ? { ...set, [field]: value } : set,
      ),
    }));
  };

  const addSet = (exerciseIndex: number) => {
    updateExercise(exerciseIndex, (ex) => {
      const last = ex.sets[ex.sets.length - 1];
      return {
        ...ex,
        sets: [
          ...ex.sets,
          {
            key: newKey(),
            weight: last?.weight ?? "",
            reps: last?.reps ?? "",
            duration: last?.duration ?? "",
          },
        ],
      };
    });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    updateExercise(exerciseIndex, (ex) => ({
      ...ex,
      sets: ex.sets.filter((_, i) => i !== setIndex),
    }));
  };

  const removeExercise = (exerciseIndex: number) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.filter((_, i) => i !== exerciseIndex),
    }));
  };

  const addExercise = (exercise: Exercise) => {
    setDraft((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          key: newKey(),
          exerciseId: exercise.id,
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup,
          trackingType: exercise.trackingType ?? DEFAULT_TRACKING_TYPE,
          sets: [{ key: newKey(), weight: "", reps: "", duration: "" }],
        },
      ],
    }));
    setPickerVisible(false);
  };

  const handleSave = async () => {
    if (!isDirty) {
      setIsDone(true);
      return;
    }

    const exercisesChanged =
      isStrength &&
      JSON.stringify(draft.exercises) !==
        JSON.stringify(initialDraft.exercises);

    if (exercisesChanged) {
      const error = validateExercises(draft.exercises);
      if (error) {
        Alert.alert(t("common.invalidData"), error);
        return;
      }
    }

    const request: EditWorkoutRequest = {
      workoutTitle: draft.title.trim() || defaultTitle,
      workoutNote: draft.note.trim(),
      exercises: exercisesChanged
        ? toRequestExercises(draft.exercises)
        : undefined,
    };

    setIsSaving(true);
    try {
      await workoutService.editWorkout(workoutId, request);
      setIsDone(true);
    } catch (error: any) {
      console.error(
        "Hiba az edzés mentésekor",
        error.response?.data || error.message,
      );
      Alert.alert(t("common.saveFailed"), t("workoutEditor.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC4C02" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <EditorHeader
        title={t("workoutEditor.title")}
        onCancel={() => router.back()}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>{t("workoutEditor.titleLabel")}</Text>
          <TextInput
            style={styles.input}
            value={draft.title}
            onChangeText={(title) =>
              setDraft((current) => ({ ...current, title }))
            }
            placeholder={defaultTitle}
            placeholderTextColor="#5A5A5E"
            maxLength={MAX_TITLE_LENGTH}
            editable={!isSaving}
          />

          <Text style={styles.label}>{t("workoutEditor.noteLabel")}</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={draft.note}
            onChangeText={(note) =>
              setDraft((current) => ({ ...current, note }))
            }
            placeholder={t("saveWorkout.notePlaceholder")}
            placeholderTextColor="#5A5A5E"
            multiline
            maxLength={MAX_NOTE_LENGTH}
            textAlignVertical="top"
            editable={!isSaving}
          />
          <Text style={styles.counter}>
            {draft.note.length}/{MAX_NOTE_LENGTH}
          </Text>

          {isStrength && (
            <>
              <Text style={styles.label}>
                {t("workoutEditor.exercisesLabel")}
              </Text>
              {draft.exercises.map((exercise, exerciseIndex) => (
                <EditableExerciseCard
                  key={exercise.key}
                  exercise={exercise}
                  disabled={isSaving}
                  onChangeSet={(setIndex, field, value) =>
                    changeSet(exerciseIndex, setIndex, field, value)
                  }
                  onAddSet={() => addSet(exerciseIndex)}
                  onRemoveSet={(setIndex) => removeSet(exerciseIndex, setIndex)}
                  onRemove={() => removeExercise(exerciseIndex)}
                />
              ))}

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setPickerVisible(true)}
                disabled={isSaving}
              >
                <Text style={styles.addButtonText}>
                  {t("workoutEditor.addExercise")}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {isStrength && (
        <ExercisePicker
          visible={isPickerVisible}
          exercises={catalog}
          addedIds={draft.exercises.map((ex) => ex.exerciseId)}
          onSelect={addExercise}
          onClose={() => setPickerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  flex: { flex: 1 },
  center: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { padding: 20, paddingBottom: 40 },
  label: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "#FFF",
    fontSize: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  noteInput: { minHeight: 120 },
  counter: { color: "#5A5A5E", fontSize: 12, textAlign: "right", marginTop: 6 },
  addButton: {
    borderWidth: 1,
    borderColor: "#FC4C02",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  addButtonText: { color: "#FC4C02", fontSize: 16, fontWeight: "700" },
});
