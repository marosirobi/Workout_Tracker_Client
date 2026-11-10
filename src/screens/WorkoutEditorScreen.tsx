import { workoutService } from "@/api/workoutService";
import { EditorHeader } from "@/components/EditorHeader";
import type { WorkoutType } from "@/store/workoutStore";
import { DEFAULT_TITLES } from "@/utils/workoutDefaults";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
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
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_TITLE_LENGTH = 100;
const MAX_NOTE_LENGTH = 255;

interface Draft {
  title: string;
  note: string;
}

const EMPTY_DRAFT: Draft = { title: "", note: "" };

export default function WorkoutEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();

  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [initialDraft, setInitialDraft] = useState<Draft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const workout = await workoutService.getWorkoutById(workoutId);
        if (!isActive) return;

        const loaded: Draft = {
          title: workout.workoutTitle ?? "",
          note: workout.workoutNote ?? "",
        };
        setWorkoutType(workout.type);
        setDraft(loaded);
        setInitialDraft(loaded);
      } catch (error: any) {
        console.error(
          "Hiba az edzés betöltésekor",
          error.response?.data || error.message,
        );
        if (isActive) {
          Alert.alert("Hiba", "Nem sikerült betölteni az edzést.");
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
  }, [workoutId]);

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

  const defaultTitle = workoutType ? DEFAULT_TITLES[workoutType] : "";

  const handleSave = async () => {
    if (!isDirty) {
      setIsDone(true);
      return;
    }

    setIsSaving(true);
    try {
      await workoutService.editWorkout(workoutId, {
        workoutTitle: draft.title.trim() || defaultTitle,
        workoutNote: draft.note.trim(),
      });
      setIsDone(true);
    } catch (error: any) {
      console.error(
        "Hiba az edzés mentésekor",
        error.response?.data || error.message,
      );
      Alert.alert(
        "Sikertelen mentés",
        "Nem sikerült elmenteni a változásokat.",
      );
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
        title="Edzés szerkesztése"
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
          <Text style={styles.label}>CÍM</Text>
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

          <Text style={styles.label}>MEGJEGYZÉS</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={draft.note}
            onChangeText={(note) =>
              setDraft((current) => ({ ...current, note }))
            }
            placeholder="Hogy ment az edzés?"
            placeholderTextColor="#5A5A5E"
            multiline
            maxLength={MAX_NOTE_LENGTH}
            textAlignVertical="top"
            editable={!isSaving}
          />
          <Text style={styles.counter}>
            {draft.note.length}/{MAX_NOTE_LENGTH}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
});
