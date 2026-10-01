import { authService } from "@/api/authService";
import { workoutService, WorkoutSummary } from "@/api/workoutService";
import { useAuthStore } from "@/store/authStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DashboardScreen() {
  const { user, clearAuth } = useAuthStore();
  const { setActiveWorkout } = useWorkoutStore();
  const router = useRouter();

  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalVisible, setModalVisible] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await workoutService.getUserWorkouts();
      setWorkouts(response.content);
    } catch (error) {
      console.error("Hiba az edzések lekérésekor", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    clearAuth();
  };

  const handleStartWorkout = async (type: "STRENGTH" | "CARDIO") => {
    try {
      setIsStarting(true);

      const currentStartTime = new Date().toISOString();
      const newWorkout = await workoutService.createWorkout({
        type: type,
        startTime: currentStartTime,
        templateId: null,
      });

      setModalVisible(false);
      setActiveWorkout(newWorkout.id, newWorkout.type, newWorkout.startTime);
      router.replace("/active-workout" as any);
    } catch (error) {
      console.error("Hiba edzes inditasakor", error);
      Alert.alert("hiba", "nem sikerult elinditani az edzest");
    } finally {
      setIsStarting(true);
    }
  };

  const renderWorkoutCard = ({ item }: { item: WorkoutSummary }) => {
    const formattedDate = new Date(item.endTime).toLocaleDateString("hu-HU");
    const durationMins = item.durationSeconds
      ? Math.floor(item.durationSeconds / 60)
      : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardType}>
            {item.type === "CARDIO" ? "Cardio" : "Workout"}
          </Text>
        </View>

        <Text style={styles.cardDate}>{formattedDate}</Text>

        <View style={styles.cardDetails}>
          {item.type === "CARDIO" && item.totalDistance && (
            <Text style={styles.detailText}>
              Distance: {item.totalDistance} km
            </Text>
          )}
          {durationMins > 0 && (
            <Text style={styles.detailText}>Time: {durationMins} min</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hey, {user?.username}!</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWorkoutCard}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              You dont have any workouts yet.
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose a workout type</Text>
            {isStarting ? (
              <ActivityIndicator
                size="large"
                color="#007BFF"
                style={{ marginVertical: 20 }}
              />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: "#FF9500" }]}
                  onPress={() => handleStartWorkout("STRENGTH")}
                >
                  <Text>STRENGTH</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: "#FF9500" }]}
                  onPress={() => handleStartWorkout("CARDIO")}
                >
                  <Text>CARDIO</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
              disabled={isStarting}
            >
              <Text>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
  logoutText: { color: "#FF3B30", fontWeight: "600", fontSize: 16 },
  listContainer: { padding: 15, paddingBottom: 100 },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#666",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a1a" },
  cardType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007BFF",
    backgroundColor: "#e6f2ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardDate: { fontSize: 14, color: "#666", marginBottom: 10 },
  cardDetails: { flexDirection: "row", gap: 15 },
  detailText: { fontSize: 14, color: "#444", fontWeight: "500" },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabIcon: { color: "#fff", fontSize: 32, fontWeight: "bold", marginTop: -4 },

  // ÚJ: Modal stílusok
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    minHeight: 300,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  modalButtons: { flexDirection: "row", gap: 20, marginBottom: 30 },
  typeButton: {
    width: 120,
    height: 120,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  typeButtonIcon: { fontSize: 40, marginBottom: 10 },
  typeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelButton: { marginTop: 10, padding: 15 },
  cancelButtonText: { color: "#666", fontSize: 16, fontWeight: "600" },
});
