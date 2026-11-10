import { exerciseService, type Exercise } from "@/api/exerciseService";
import { IconButton } from "@/components/IconButton";
import { ExercisePicker } from "@/components/workout/ExercisePicker";
import { SetRow } from "@/components/workout/SetRow";
import { prepareLiveDisplay } from "@/services/live/workoutLiveSync";
import { startLocationTracking } from "@/services/locationTask";
import { discardActiveWorkout } from "@/services/workoutActions";
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MOVING_TIMEOUT_MS = 6000;

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const {
    activeWorkoutType,
    exercises,
    startTime,
    trackPoints,
    totalDistanceKm,
    elevationGain,
    currentSpeedMs,
    pausedAt,
    lastMovedAt,
    totalPausedMs,
    addExercise,
    addSet,
    updateSet,
    clearActiveWorkout,
    pauseWorkout,
    resumeWorkout,
    beginFinish,
    moveExercise,
  } = useWorkoutStore();

  const [now, setNow] = useState(() => Date.now());
  const elapsedSeconds = getElapsedSeconds(
    { startTime, pausedAt, totalPausedMs },
    now,
  );
  const isPaused = pausedAt !== null;

  const [gpsStatus, setGpsStatus] = useState("GPS keres...");

  const [isModalVisible, setModalVisible] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);

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
            try {
              await discardActiveWorkout();
            } catch {
              Alert.alert(
                "Sikertelen elvetés",
                "Nem sikerült törölni az edzést a szerverről. Ellenőrizd az internetkapcsolatot!",
              );
            }
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
  }, [router, clearActiveWorkout]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const avgPaceMinutes = getAvgPaceMinutes(elapsedSeconds, totalDistanceKm);
  const isMoving =
    lastMovedAt !== null && now - lastMovedAt < MOVING_TIMEOUT_MS;
  const liveSpeedMs = isMoving ? currentSpeedMs : 0;
  const currentPaceMinutes = getCurrentPaceMinutes(liveSpeedMs);

  const handleSelectExercise = (exercise: Exercise) => {
    addExercise(exercise.id, exercise.exerciseName);
    setModalVisible(false);
  };

  const openExerciseInfo = (exercise: Exercise) => {
    setModalVisible(false);
    router.push(`/exercises/${exercise.id}`);
  };

  const renderExercise = ({
    item,
    index,
  }: {
    item: WorkoutExercise;
    index: number;
  }) => {
    return (
      <View style={styles.exerciseCard}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {item.exerciseName}
          </Text>
          <View style={styles.moveButtons}>
            <IconButton
              name="chevron-up"
              onPress={() => moveExercise(item.exerciseId, -1)}
              disabled={index === 0}
            />
            <IconButton
              name="chevron-down"
              onPress={() => moveExercise(item.exerciseId, 1)}
              disabled={index === exercises.length - 1}
            />
          </View>
        </View>

        <View style={styles.setHeader}>
          <Text style={styles.setHeaderText}>Szett</Text>
          <Text style={styles.setHeaderText}>Súly</Text>
          <Text style={styles.setHeaderText}>Ismétlés</Text>
          <Text style={styles.setHeaderText}>Kész</Text>
        </View>

        {item.sets.map((set) => (
          <SetRow
            key={set.setNumber}
            set={set}
            onUpdate={(weight, reps, isCompleted) =>
              updateSet(
                item.exerciseId,
                set.setNumber,
                weight,
                reps,
                isCompleted,
              )
            }
          />
        ))}

        <TouchableOpacity
          style={styles.addSetButton}
          onPress={() => addSet(item.exerciseId)}
        >
          <Text style={styles.addSetButtonText}>+ Új szett</Text>
        </TouchableOpacity>
      </View>
    );
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
            keyExtractor={(item) => item.exerciseId.toString()}
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
              GPS: {gpsStatus} ({trackPoints.length} pont)
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
                {(liveSpeedMs * 3.6).toFixed(1)}
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
              style={[styles.controlButton, styles.secondaryButton]}
              onPress={beginFinish}
            >
              <Text style={styles.controlButtonText}>■ Befejezés</Text>
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

      <ExercisePicker
        visible={isModalVisible}
        exercises={availableExercises}
        addedIds={exercises.map((ex) => ex.exerciseId)}
        onSelect={handleSelectExercise}
        onClose={() => setModalVisible(false)}
        onInfo={openExerciseInfo}
      />
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
    flexShrink: 1,
    marginRight: 12,
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
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  moveButtons: { flexDirection: "row", gap: 6 },
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
});
