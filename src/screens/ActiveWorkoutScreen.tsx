import { exerciseService } from "@/api/exerciseService";
import { workoutService } from "@/api/workoutService";
import { prepareLiveDisplay } from "@/services/live/workoutLiveSync";
import {
  startLocationTracking,
  stopLocationTracking,
} from "@/services/locationTask";
import {
  getElapsedSeconds,
  useWorkoutStore,
  WorkoutExercise,
} from "@/store/workoutStore";
import {
  formatDuration,
  formatPace,
  getAvgPaceMinutes,
  getCurrentPaceMinutes,
} from "@/utils/workoutFormat";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const {
    activeWorkoutId,
    activeWorkoutType,
    exercises,
    startTime,
    trackPoints,
    totalDistanceKm,
    elevationGain,
    currentSpeedMs,
    pausedAt,
    totalPausedMs,
    addExercise,
    addSet,
    updateSet,
    clearActiveWorkout,
    pauseWorkout,
    resumeWorkout,
  } = useWorkoutStore();

  const [now, setNow] = useState(() => Date.now());
  const elapsedSeconds = getElapsedSeconds(
    { startTime, pausedAt, totalPausedMs },
    now,
  );
  const isPaused = pausedAt !== null;

  const [gpsStatus, setGpsStatus] = useState("GPS keres...");
  const [isFinishing, setIsFinishing] = useState(false);

  const [isModalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);

  useEffect(() => {
    if (activeWorkoutType !== "STRENGTH") return;

    const fetchExercises = async () => {
      try {
        const data = await exerciseService.getAllExercises();
        setAvailableExercises(data);
      } catch (error) {
        console.error("Hiba a gyakorlatok betoltesekor:", error);
      }
    };
    fetchExercises();
  }, [activeWorkoutType]);

  useEffect(() => {
    if (!activeWorkoutType) return;

    const startTracking = async () => {
      await prepareLiveDisplay();

      if (activeWorkoutType !== "CARDIO") return;

      const mode = await startLocationTracking();
      if (mode === "denied") {
        setGpsStatus("GPS denied");
        Alert.alert(
          "Helymeghatározás szükséges",
          "Engedélyezd a GPS-t a kardió edzés méréséhez!",
        );
      } else if (mode === "foreground") {
        setGpsStatus("GPS active(foreground)");
        Alert.alert(
          "Lezárt képernyőnél nem mér",
          'Ha azt szeretnéd, hogy az edzés akkor is mérjen, amikor a telefon le van zárva, a beállításokban válaszd a "Mindig engedélyezve" lehetőséget a helyadatoknál.',
          [
            { text: "Most nem", style: "cancel" },
            { text: "Beállítások", onPress: () => Linking.openSettings() },
          ],
        );
      } else {
        setGpsStatus("GPS active");
      }
    };
    startTracking();
  }, [activeWorkoutType]);

  useEffect(() => {
    const onBackPress = () => {
      Alert.alert("Edzes folyamatban", "Biztosan megszakitod az edzest?", [
        { text: "Megsem", style: "cancel" },
        {
          text: "Megszakitas",
          style: "destructive",
          onPress: async () => {
            await stopLocationTracking();
            clearActiveWorkout();
            router.replace("/dashboard");
          },
        },
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const avgPaceMinutes = getAvgPaceMinutes(elapsedSeconds, totalDistanceKm);
  const currentPaceMinutes = getCurrentPaceMinutes(currentSpeedMs);

  const filteredExercises = availableExercises.filter((ex) =>
    ex.exerciseName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectExercise = (exerciseId: number, exerciseName: string) => {
    addExercise(exerciseId, exerciseName);
    setModalVisible(false);
    setSearchQuery("");
  };

  const renderSet = (exerciseId: number, set: any) => {
    return (
      <View key={set.setNumber} style={styles.setRow}>
        <Text style={styles.setNumber}>{set.setNumber}</Text>
        <TextInput
          style={[
            styles.input,
            set.isCompleted && { color: "#888", backgroundColor: "#222" },
          ]}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#666"
          value={set.weight ? set.weight.toString() : ""}
          onChangeText={(val) =>
            updateSet(
              exerciseId,
              set.setNumber,
              parseFloat(val) || 0,
              set.reps,
              set.isCompleted,
            )
          }
          editable={!set.isCompleted}
        />
        <Text style={styles.unitText}>kg</Text>

        <TextInput
          style={[
            styles.input,
            set.isCompleted && { color: "#888", backgroundColor: "#222" },
          ]}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#666"
          value={set.reps ? set.reps.toString() : ""}
          onChangeText={(val) =>
            updateSet(
              exerciseId,
              set.setNumber,
              set.weight,
              parseInt(val) || 0,
              set.isCompleted,
            )
          }
          editable={!set.isCompleted}
        />
        <Text style={styles.unitText}>ism</Text>

        <TouchableOpacity
          style={[
            styles.checkButton,
            set.isCompleted && styles.checkButtonCompleted,
          ]}
          onPress={() =>
            updateSet(
              exerciseId,
              set.setNumber,
              set.weight,
              set.reps,
              !set.isCompleted,
            )
          }
        >
          <Text style={styles.checkButtonText}>
            {set.isCompleted ? "✓" : "○"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderExercise = ({ item }: { item: WorkoutExercise }) => {
    return (
      <View style={styles.exerciseCard}>
        <Text style={styles.exerciseName}>{item.exerciseName}</Text>

        <View style={styles.setHeader}>
          <Text style={styles.setHeaderText}>Szett</Text>
          <Text style={styles.setHeaderText}>Súly</Text>
          <Text style={styles.setHeaderText}>Ismétlés</Text>
          <Text style={styles.setHeaderText}>Kész</Text>
        </View>
        {item.sets.map((set: any) => renderSet(item.exerciseId, set))}

        <TouchableOpacity
          style={styles.addSetButton}
          onPress={() => addSet(item.exerciseId)}
        >
          <Text style={styles.addSetButtonText}>+ Új szett</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleFinishWorkout = async () => {
    if (!activeWorkoutId || !activeWorkoutType || isFinishing) return;
    setIsFinishing(true);

    try {
      const currentEndTime = new Date().toISOString();
      if (activeWorkoutType === "CARDIO") {
        await workoutService.saveCardioData(activeWorkoutId, {
          workoutTitle: "kardio",
          endTime: currentEndTime,
          stats: {
            totalDistance: Number(totalDistanceKm.toFixed(3)),
            avgPace: Number(avgPaceMinutes.toFixed(2)),
            movingTimeSeconds: elapsedSeconds,
            elevationGain: elevationGain,
          },
          trackPoints: trackPoints,
        });
      } else if (activeWorkoutType === "STRENGTH") {
        const payloadExercises = exercises.map((ex, index) => {
          return {
            exerciseId: ex.exerciseId,
            orderIndex: index + 1,
            sets: ex.sets
              .filter((s) => s.isCompleted)
              .map((s) => ({
                setNumber: s.setNumber,
                weight: s.weight,
                reps: s.reps,
              })),
          };
        });

        const updateRequest = {
          workoutTitle: "edzes",
          endTime: currentEndTime,
          exercises: payloadExercises,
        };

        await workoutService.updateWorkout(activeWorkoutId, updateRequest);
      }
      await stopLocationTracking();
      clearActiveWorkout();
      router.replace("/dashboard");
    } catch (error: any) {
      console.error(
        "Hiba az edzes befejezesekor. A szerver válasza:",
        error.response?.data || error.message,
      );
      if (error.response?.status === 404 || error.response?.status === 400) {
        Alert.alert(
          "Az edzés nem található",
          "Ez az edzés már nem létezik a szerveren. A helyi adatok törlésre kerülnek.",
          [
            {
              text: "Rendben",
              onPress: async () => {
                await stopLocationTracking();
                clearActiveWorkout();
                router.replace("/dashboard");
              },
            },
          ],
        );
        return;
      }
      Alert.alert(
        "Sikertelen mentes",
        "Nem sikerült befejezni az edzést. Ellenőrizd az internetkapcsolatot!",
      );
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <View style={styles.container}>
      {isPaused && <Text style={styles.pausedLabel}>PAUSED</Text>}
      <Text style={[styles.timerText, isPaused && styles.timerTextPaused]}>
        {formatDuration(elapsedSeconds)}
      </Text>

      {activeWorkoutType === "STRENGTH" && (
        <View style={{ flex: 1, width: "100%" }}>
          <FlatList
            data={exercises}
            renderItem={renderExercise}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addExerciseButtonText}>+ Új Gyakorlat</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeWorkoutType === "CARDIO" && (
        <View style={styles.cardioDashboard}>
          <View style={styles.gpsBadge}>
            <Text style={styles.gpsBadgeText}>
              📍 {gpsStatus} ({trackPoints.length} pont)
            </Text>
          </View>

          <View style={styles.heroDistanceBox}>
            <Text style={styles.heroDistanceLabel}>TÁVOLSÁG</Text>
            <Text style={styles.heroDistanceValue}>
              {totalDistanceKm.toFixed(2)}
            </Text>
            <Text style={styles.heroDistanceUnit}>kilométer</Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>ÁTLAGTEMPÓ</Text>
              <Text style={styles.metricValue}>
                {formatPace(avgPaceMinutes)}
              </Text>
              <Text style={styles.metricUnit}>/km</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>AKT. TEMPÓ</Text>
              <Text style={styles.metricValue}>
                {formatPace(currentPaceMinutes)}
              </Text>
              <Text style={styles.metricUnit}>/km</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>SZINTEMELKEDÉS</Text>
              <Text style={styles.metricValue}>
                {Math.round(elevationGain)}
              </Text>
              <Text style={styles.metricUnit}>méter</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>SEBESSÉG</Text>
              <Text style={styles.metricValue}>
                {(currentSpeedMs * 3.6).toFixed(1)}
              </Text>
              <Text style={styles.metricUnit}>km/h</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.controls}>
        {isPaused ? (
          <>
            <TouchableOpacity
              style={[styles.controlButton, styles.primaryButton]}
              onPress={resumeWorkout}
            >
              <Text style={styles.controlButtonText}>▶ Folytatás</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.secondaryButton,
                isFinishing && { opacity: 0.6 },
              ]}
              onPress={handleFinishWorkout}
              disabled={isFinishing}
            >
              <Text style={styles.controlButtonText}>
                {isFinishing ? "Mentés…" : "■  Befejezés"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={pauseWorkout}
          >
            <Text style={styles.controlButtonText}>❚❚ Szünet</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Válassz gyakorlatot</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalExerciseRow}
                onPress={() => handleSelectExercise(item.id, item.exerciseName)}
              >
                <Text style={styles.modalExerciseName}>
                  {item.exerciseName}
                </Text>
                <Text style={styles.modalMuscleGroup}>{item.muscleGroup}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptySearchText}>Nothing was found</Text>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    padding: 20,
    paddingTop: 55,
  },
  timerLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  timerText: {
    color: "white",
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 15,
  },

  cardioDashboard: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 20,
  },
  gpsBadge: {
    backgroundColor: "#1e1e1e",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  gpsBadgeText: { color: "#4CAF50", fontSize: 13, fontWeight: "600" },
  heroDistanceBox: { alignItems: "center", marginVertical: 10 },
  heroDistanceLabel: {
    color: "#888",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  heroDistanceValue: {
    color: "#FF5722",
    fontSize: 76,
    fontWeight: "900",
    lineHeight: 84,
  },
  heroDistanceUnit: { color: "#aaa", fontSize: 18, marginTop: -5 },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  metricBox: {
    backgroundColor: "#1e1e1e",
    width: "48%",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  metricLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  metricValue: { color: "white", fontSize: 28, fontWeight: "bold" },
  metricUnit: { color: "#666", fontSize: 12, marginTop: 2 },

  exerciseCard: {
    backgroundColor: "#1e1e1e",
    width: "100%",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  exerciseName: {
    color: "#007BFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  setHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  setHeaderText: {
    color: "#888",
    fontSize: 12,
    width: 50,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  setNumber: { color: "white", fontSize: 16, fontWeight: "bold", width: 30 },
  input: {
    backgroundColor: "#333",
    color: "white",
    fontSize: 16,
    borderRadius: 5,
    width: 60,
    height: 40,
    textAlign: "center",
  },
  unitText: { color: "#888", fontSize: 12, marginLeft: -10 },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  checkButtonCompleted: { backgroundColor: "#4CAF50" },
  checkButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  addSetButton: { marginTop: 10, alignSelf: "center", padding: 10 },
  addSetButtonText: { color: "#007BFF", fontSize: 16, fontWeight: "bold" },
  addExerciseButton: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  pausedLabel: {
    color: "#FC4C02",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  timerTextPaused: { color: "#666" },
  controls: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButton: { backgroundColor: "#FC4C02" },
  secondaryButton: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#333",
  },
  controlButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  addExerciseButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  modalContainer: { flex: 1, backgroundColor: "#121212", padding: 20 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingTop: 20,
  },
  modalTitle: { color: "white", fontSize: 22, fontWeight: "bold" },
  closeModalText: { color: "#FF4444", fontSize: 16, fontWeight: "bold" },
  searchInput: {
    backgroundColor: "#1e1e1e",
    color: "white",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  modalExerciseRow: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalExerciseName: { color: "white", fontSize: 18, fontWeight: "bold" },
  modalMuscleGroup: { color: "#888", fontSize: 14 },
  emptySearchText: {
    color: "#888",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
});
