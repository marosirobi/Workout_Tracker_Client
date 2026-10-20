import { workoutService } from "@/api/workoutService";
import {
  discardActiveWorkout,
  endActiveWorkoutLocally,
} from "@/services/workoutActions";
import { getElapsedSeconds, useWorkoutStore } from "@/store/workoutStore";
import { getAvgPaceMinutes } from "@/utils/workoutFormat";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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

const MAX_TEXT_LENGTH = 255;
const DEFAULT_TITLE = "Cardio";

export default function SaveWorkoutScreen() {
  const {
    activeWorkoutId,
    startTime,
    pausedAt,
    totalPausedMs,
    totalDistanceKm,
    elevationGain,
    trackPoints,
    cancelFinish,
  } = useWorkoutStore();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const isBusy = isSaving || isDiscarding;

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!isBusy) cancelFinish();
        return true;
      },
    );
    return () => subscription.remove();
  }, [cancelFinish, isBusy]);

  const handleSave = async () => {
    if (!activeWorkoutId || isBusy) return;
    setIsSaving(true);

    try {
      const movingSeconds = getElapsedSeconds({
        startTime,
        pausedAt,
        totalPausedMs,
      });
      await workoutService.saveCardioData(activeWorkoutId, {
        workoutTitle: title.trim() || DEFAULT_TITLE,
        workoutNote: note.trim() || undefined,
        endTime: new Date().toISOString(),
        stats: {
          totalDistance: Number(totalDistanceKm.toFixed(3)),
          avgPace: Number(
            getAvgPaceMinutes(movingSeconds, totalDistanceKm).toFixed(2),
          ),
          movingTimeSeconds: movingSeconds,
          elevationGain: Math.round(elevationGain),
        },
        trackPoints,
      });

      await endActiveWorkoutLocally();
    } catch (error: any) {
      console.error("Mentési hiba:", error.response?.data || error.message);
      const status = error.response?.status;
      if (status === 404 || status === 400) {
        Alert.alert(
          "Az edzés nem található",
          "Ez az edzés már nem létezik a szerveren. A helyi adatok törlésre kerülnek.",
          [{ text: "Rendben", onPress: endActiveWorkoutLocally }],
        );
        return;
      }
      Alert.alert(
        "Sikertelen mentés",
        "Nem sikerült elmenteni az edzést. Ellenőrizd az internetkapcsolatot, és próbáld újra!",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const discard = async () => {
    if (!activeWorkoutId) return;
    setIsDiscarding(true);

    try {
      await discardActiveWorkout();
    } catch {
      Alert.alert(
        "Sikertelen elvetés",
        "Nem sikerült törölni az edzést a szerverről. Ellenőrizd az internetkapcsolatot!",
      );
    } finally {
      setIsDiscarding(false);
    }
  };

  const confirmDiscard = async () => {
    if (isBusy) return;
    Alert.alert(
      "Edzés elvetése",
      "Biztosan elveted ezt az edzést? Ez nem vonható vissza.",
      [
        { text: "Mégsem", style: "cancel" },
        { text: "Elvetés", style: "destructive", onPress: discard },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={cancelFinish}
          disabled={isBusy}
          hitSlop={12}
        >
          <Text style={[styles.headerAction, isBusy && styles.disabled]}>
            Folytatás
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edzés mentése</Text>
        <View style={styles.headerSide} />
      </View>

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
            value={title}
            onChangeText={setTitle}
            placeholder={DEFAULT_TITLE}
            placeholderTextColor="#5A5A5E"
            maxLength={100}
            returnKeyType="next"
            editable={!isBusy}
          />
          <Text style={styles.label}>MEGJEGYZES</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="Hogy ment az edzés?"
            placeholderTextColor="#5A5A5E"
            multiline
            maxLength={MAX_TEXT_LENGTH}
            textAlignVertical="top"
            editable={!isBusy}
          />
          <Text style={styles.counter}>
            {note.length}/{MAX_TEXT_LENGTH}
          </Text>

          <TouchableOpacity
            style={[styles.saveButton, isBusy && styles.disabled]}
            onPress={handleSave}
            disabled={isBusy}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Mentés</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.discardButton}
            onPress={confirmDiscard}
            disabled={isBusy}
          >
            {isDiscarding ? (
              <ActivityIndicator color="#FF453A" />
            ) : (
              <Text style={[styles.discardText, isBusy && styles.disabled]}>
                Edzés elvetése
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  flex: { flex: 1 },
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
  headerAction: { color: "#FC4C02", fontSize: 16, fontWeight: "600" },
  headerTitle: { color: "#804f4f", fontSize: 17, fontWeight: "700" },
  content: { padding: 20, paddingBottom: 40 },
  label: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
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
  saveButton: {
    backgroundColor: "#FC4C02",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  saveButtonText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  discardButton: { alignItems: "center", paddingVertical: 18, marginTop: 8 },
  discardText: { color: "#FF453A", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
