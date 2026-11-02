import { workoutService, WorkoutSummary } from "@/api/workoutService";
import { useAuthStore } from "@/store/authStore";
import { tabStyles } from "@/styles/tabScreen";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await workoutService.getUserWorkouts();
      setWorkouts(response.content);
    } catch (error) {
      console.error("Hiba az edzések lekérésekor", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [fetchWorkouts]),
  );

  const renderWorkoutCard = ({ item }: { item: WorkoutSummary }) => {
    const formattedDate = new Date(item.endTime).toLocaleDateString("hu-HU");
    const shownSeconds = item.movingTimeSeconds ?? item.durationSeconds ?? 0;
    const durationMins = Math.floor(shownSeconds / 60);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/workouts/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardType}>
            {item.type === "CARDIO" ? "Kardió" : "Erőedzés"}
          </Text>
        </View>

        <Text style={styles.cardDate}>{formattedDate}</Text>

        <View style={styles.cardDetails}>
          {item.type === "CARDIO" && item.totalDistance != null && (
            <Text style={styles.detailText}>
              {item.totalDistance.toFixed(2)} km
            </Text>
          )}
          {durationMins > 0 && (
            <Text style={styles.detailText}>{durationMins} perc</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={tabStyles.container} edges={["top"]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FC4C02" />
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWorkoutCard}
          contentContainerStyle={tabStyles.content}
          ListHeaderComponent={
            <Text style={tabStyles.title}>Szia, {user?.username}!</Text>
          }
          ListEmptyComponent={
            <Text style={tabStyles.mutedText}>Még nincs edzésed.</Text>
          }
          showsVerticalScrollIndicator={false}
        ></FlatList>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: { color: "#FFF", fontSize: 17, fontWeight: "700", flexShrink: 1 },
  cardType: {
    color: "#FC4C02",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 12,
  },
  cardDate: { color: "#8E8E93", fontSize: 13, marginBottom: 10 },
  cardDetails: { flexDirection: "row", gap: 16 },
  detailText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
});
