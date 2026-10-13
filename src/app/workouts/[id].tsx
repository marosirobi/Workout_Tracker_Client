import { workoutService } from "@/api/workoutService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function WorkoutDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      try {
        const data = await workoutService.getWorkoutById(Number(id));
        setWorkout(data);
      } catch (error) {
        console.error("Hiba a részletek letöltésekor", error);
        Alert.alert("Hiba", "Nem sikerült betölteni az edzést.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchWorkoutDetails();
  }, [id]);

  const handleDelete = () => {
    Alert.alert("Törlés", "Biztosan törölni szeretnéd ezt az edzést?", [
      { text: "Mégsem", style: "cancel" },
      {
        text: "Törlés",
        style: "destructive",
        onPress: async () => {
          try {
            await workoutService.deleteWorkout(Number(id));
            router.replace("/dashboard");
          } catch (error) {
            Alert.alert("Hiba", "Nem sikerült törölni az edzést.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!workout) return null;

  return (
    <ScrollView style={styles.container}>
      {/* FEJLÉC */}
      <View style={styles.header}>
        <Text style={styles.title}>{workout.workoutTitle}</Text>
        <Text style={styles.date}>
          {new Date(workout.startTime).toLocaleString("hu-HU")}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {workout.type === "STRENGTH" ? "💪 SÚLYZÓS" : "🏃 KARDIÓ"}
          </Text>
        </View>
      </View>

      {workout.type === "STRENGTH" && workout.exercises && (
        <View style={styles.section}>
          {workout.exercises.map((exercise: any) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              {exercise.sets.map((set: any) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setText}>{set.setNumber}. Szett</Text>
                  <Text style={styles.setText}>{set.weight} kg</Text>
                  <Text style={styles.setText}>{set.reps} ism.</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {workout.type === "CARDIO" && workout.cardioStats && (
        <View style={styles.cardioGrid}>
          <View style={styles.cardioBox}>
            <Text style={styles.cardioLabel}>Távolság</Text>
            <Text style={styles.cardioValue}>
              {workout.cardioStats.totalDistance} km
            </Text>
          </View>
          <View style={styles.cardioBox}>
            <Text style={styles.cardioLabel}>Átlagtempó</Text>
            <Text style={styles.cardioValue}>
              {workout.cardioStats.avgPace} p/km
            </Text>
          </View>
          <View style={styles.cardioBox}>
            <Text style={styles.cardioLabel}>Szintemelkedés</Text>
            <Text style={styles.cardioValue}>
              {workout.cardioStats.elevationGain} m
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Edzés Törlése</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20 },
  centerContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  header: { marginBottom: 30, alignItems: "center", paddingTop: 40 },
  title: { color: "white", fontSize: 28, fontWeight: "bold", marginBottom: 5 },
  date: { color: "#888", fontSize: 16, marginBottom: 15 },
  badge: {
    backgroundColor: "#007BFF",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: { color: "white", fontWeight: "bold", fontSize: 12 },
  section: { marginBottom: 20 },

  exerciseCard: {
    backgroundColor: "#1e1e1e",
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
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingVertical: 8,
  },
  setText: { color: "white", fontSize: 16 },

  cardioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardioBox: {
    backgroundColor: "#1e1e1e",
    width: "48%",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
  },
  cardioLabel: { color: "#888", fontSize: 14, marginBottom: 5 },
  cardioValue: { color: "white", fontSize: 22, fontWeight: "bold" },

  deleteButton: {
    marginTop: 20,
    marginBottom: 50,
    backgroundColor: "#FF4444",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
