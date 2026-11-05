import { exerciseService, type Exercise } from "@/api/exerciseService";
import { templateService, type TemplateRequest } from "@/api/templateService";
import { ExercisePicker } from "@/components/workout/ExercisePicker";
import {
  TempExercise,
  TemplateExerciseRow,
} from "@/components/workout/TemplateExerciseRow";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useMemo, useState } from "react";
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

const MIN_SETS = 1;
const MAX_SETS = 20;
const DEFAULT_SETS = 3;
const MAX_NAME_LENGTH = 100;

interface Draft {
  name: string;
  exercises: TempExercise[];
}

const EMPTY_DRAFT: Draft = { name: "", exercises: [] };

export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const templateId = id === "new" ? null : Number(id);
  const isNew = templateId === null;

  const router = useRouter();
  const navigation = useNavigation();

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [initialDraft, setInitialDraft] = useState<Draft>(EMPTY_DRAFT);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    exerciseService
      .getAllExercises()
      .then(setCatalog)
      .catch((error) =>
        console.error("Hiba a gyakorlatok betöltésekor", error),
      );
  }, []);

  useEffect(() => {
    if (templateId === null) return;
    let isActive = true;

    const load = async () => {
      try {
        const templates = await templateService.getMyTemplates();
        if (!isActive) return;

        const template = templates.find((t) => t.id === templateId);
        if (!template) {
          Alert.alert("Hiba", "A sablon nem található.");
          setIsDone(true);
          return;
        }

        const loaded: Draft = {
          name: template.templateName,
          exercises: template.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            muscleGroup: ex.muscleGroup,
            targetSets: ex.targetSets,
          })),
        };
        setDraft(loaded);
        setInitialDraft(loaded);
      } catch (error) {
        console.error("Hiba a sablon betöltésekor", error);
        if (isActive) {
          Alert.alert("Hiba", "Nem sikerült betölteni a sablont.");
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
  }, [templateId]);

  useEffect(() => {
    if (isDone) router.back();
  }, [isDone, router]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialDraft),
    [draft, initialDraft],
  );

  usePreventRemove(isDirty && !isDone, ({ data }) => {
    Alert.alert(
      "Elveted a módosításokat?",
      "A nem mentett változások elvesznek.",
      [
        { text: "Maradok", style: "cancel" },
        {
          text: "Elvetés",
          style: "destructive",
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });

  const updateExercises = (
    change: (list: TempExercise[]) => TempExercise[],
  ) => {
    setDraft((current) => ({
      ...current,
      exercises: change(current.exercises),
    }));
  };

  const addExercise = (exercise: Exercise) => {
    updateExercises((list) => [
      ...list,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.exerciseName,
        muscleGroup: exercise.muscleGroup,
        targetSets: DEFAULT_SETS,
      },
    ]);
    setPickerVisible(false);
  };

  const changeSets = (index: number, delta: number) => {
    updateExercises((list) =>
      list.map((ex, i) =>
        i === index
          ? {
              ...ex,
              targetSets: Math.min(
                MAX_SETS,
                Math.max(MIN_SETS, ex.targetSets + delta),
              ),
            }
          : ex,
      ),
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    updateExercises((list) => {
      const target = index + direction;
      if (target < 0 || target >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const remove = (index: number) => {
    updateExercises((list) => list.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const name = draft.name.trim();
    if (!name) {
      Alert.alert("Hiányzó név", "Adj nevet a sablonnak.");
      return;
    }
    if (draft.exercises.length === 0) {
      Alert.alert("Üres sablon", "Adj hozzá legalább egy gyakorlatot.");
      return;
    }

    const request: TemplateRequest = {
      templateName: name,
      exercises: draft.exercises.map((ex, index) => ({
        exerciseId: ex.exerciseId,
        orderIndex: index + 1,
        targetSets: ex.targetSets,
      })),
    };

    setIsSaving(true);
    try {
      if (templateId === null) {
        await templateService.createTemplate(request);
      } else {
        await templateService.updateTemplate(request, templateId);
      }
      setIsDone(true);
    } catch (error: any) {
      console.error(
        "Hiba a sablon mentésekor",
        error.response?.data || error.message,
      );
      Alert.alert("Sikertelen mentés", "Nem sikerült elmenteni a sablont.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (templateId === null) return;
    setIsSaving(true);
    try {
      await templateService.deleteTemplate(templateId);
      setIsDone(true);
    } catch (error: any) {
      console.error(
        "Hiba a sablon törlésekor",
        error.response?.data || error.message,
      );
      Alert.alert("Sikertelen törlés", "Nem sikerült törölni a sablont.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Sablon törlése",
      "Biztosan törlöd ezt a sablont? A vele végzett edzéseid megmaradnak.",
      [
        { text: "Mégse", style: "cancel" },
        { text: "Törlés", style: "destructive", onPress: handleDelete },
      ],
    );
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => router.back()}
          disabled={isSaving}
          hitSlop={12}
        >
          <Text style={styles.headerAction}>Mégse</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNew ? "Új sablon" : "Sablon szerkesztése"}
        </Text>
        <TouchableOpacity
          style={[styles.headerSide, styles.headerRight]}
          onPress={handleSave}
          disabled={isSaving}
          hitSlop={12}
        >
          {isSaving ? (
            <ActivityIndicator color="#FC4C02" />
          ) : (
            <Text style={[styles.headerAction, styles.headerSave]}>Mentés</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>NÉV</Text>
          <TextInput
            style={styles.input}
            value={draft.name}
            onChangeText={(name) =>
              setDraft((current) => ({ ...current, name }))
            }
            placeholder="pl. Mell-tricepsz nap"
            placeholderTextColor="#5A5A5E"
            maxLength={MAX_NAME_LENGTH}
            editable={!isSaving}
          />

          <Text style={styles.label}>GYAKORLATOK</Text>
          {draft.exercises.length === 0 && (
            <Text style={styles.empty}>Még nincs gyakorlat a sablonban.</Text>
          )}
          {draft.exercises.map((exercise, index) => (
            <TemplateExerciseRow
              key={exercise.exerciseId}
              exercise={exercise}
              isFirst={index === 0}
              isLast={index === draft.exercises.length - 1}
              minSets={MIN_SETS}
              maxSets={MAX_SETS}
              onChangeSets={(delta) => changeSets(index, delta)}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              onRemove={() => remove(index)}
            />
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setPickerVisible(true)}
            disabled={isSaving}
          >
            <Text style={styles.addButtonText}>+ Gyakorlat hozzáadása</Text>
          </TouchableOpacity>

          {!isNew && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={confirmDelete}
              disabled={isSaving}
            >
              <Text style={styles.deleteText}>Sablon törlése</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePicker
        visible={isPickerVisible}
        exercises={catalog}
        addedIds={draft.exercises.map((ex) => ex.exerciseId)}
        onSelect={addExercise}
        onClose={() => setPickerVisible(false)}
      />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2A",
  },
  headerSide: { width: 80 },
  headerRight: { alignItems: "flex-end" },
  headerTitle: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  headerAction: { color: "#FC4C02", fontSize: 16, fontWeight: "600" },
  headerSave: { fontWeight: "800" },
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
  empty: { color: "#8E8E93", fontSize: 15, marginBottom: 10 },
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
  deleteButton: { alignItems: "center", paddingVertical: 18, marginTop: 24 },
  deleteText: { color: "#FF453A", fontSize: 16, fontWeight: "600" },
});
