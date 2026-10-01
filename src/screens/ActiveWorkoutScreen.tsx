import { useWorkoutStore } from "@/store/workoutStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    BackHandler,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { activeWorkoutType, startTime, clearActiveWorkout } =
    useWorkoutStore();
  const [elapsedTime, setElapsedTime] = useState("00:00");

  useEffect(() => {
    const onBackPress = () => {
      Alert.alert("Edzes folyamatban", "Biztosan megszakitod az edzest?", [
        { text: "Megsem", style: "cancel" },
        {
          text: "Megszakitas",
          style: "destructive",
          onPress: () => {
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
    if (!startTime) return;

    const interval = setInterval(() => {
      const start = new Date(startTime).valueOf();
      const now = Date.now();
      const diffSeconds = Math.floor((now - start) / 1000);

      const minutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;

      setElapsedTime(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const handleFinishWorkout = () => {
    clearActiveWorkout();
    router.replace("/dashboard");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.typeText}>
        {activeWorkoutType === "CARDIO" ? "CARDIO" : "STRENGTH"}
      </Text>
      <Text style={styles.timerText}>{elapsedTime}</Text>

      <TouchableOpacity
        style={styles.finishButton}
        onPress={handleFinishWorkout}
      >
        <Text style={styles.finishButtonText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  typeText: {
    fontSize: 24,
    color: "#007BFF",
    fontWeight: "bold",
    marginBottom: 20,
  },
  timerText: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 50,
    fontVariant: ["tabular-nums"],
  },
  finishButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  finishButtonText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
