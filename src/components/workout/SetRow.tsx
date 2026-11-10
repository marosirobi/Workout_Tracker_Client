import type { ExerciseSet } from "@/store/workoutStore";
import {
    formatDecimalInput,
    parseDecimalInput,
    sanitizeDecimal,
    sanitizeInteger,
} from "@/utils/numberInput";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface SetRowProps {
  set: ExerciseSet;
  onUpdate: (weight: number, reps: number, isCompleted: boolean) => void;
}

export function SetRow({ set, onUpdate }: SetRowProps) {
  const [weightText, setWeightText] = useState(() =>
    formatDecimalInput(set.weight),
  );

  const handleWeightChange = (text: string) => {
    const clean = sanitizeDecimal(text);
    setWeightText(clean);
    onUpdate(parseDecimalInput(clean) ?? 0, set.reps, set.isCompleted);
  };

  const handleRepsChange = (text: string) => {
    const clean = sanitizeInteger(text);
    onUpdate(set.weight, clean === "" ? 0 : Number(clean), set.isCompleted);
  };

  const toggleCompleted = () => {
    onUpdate(set.weight, set.reps, !set.isCompleted);
  };

  const inputStyle = [styles.input, set.isCompleted && styles.inputCompleted];

  return (
    <View style={styles.row}>
      <Text style={styles.setNumber}>{set.setNumber}</Text>

      <TextInput
        style={inputStyle}
        value={weightText}
        onChangeText={handleWeightChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor="#666"
        maxLength={7}
        editable={!set.isCompleted}
      />
      <Text style={styles.unit}>kg</Text>

      <TextInput
        style={inputStyle}
        value={set.reps ? String(set.reps) : ""}
        onChangeText={handleRepsChange}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor="#666"
        maxLength={4}
        editable={!set.isCompleted}
      />
      <Text style={styles.unit}>ism</Text>

      <TouchableOpacity
        style={[styles.check, set.isCompleted && styles.checkCompleted]}
        onPress={toggleCompleted}
      >
        <Ionicons
          name={set.isCompleted ? "checkmark" : "ellipse-outline"}
          size={20}
          color="#FFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
    width: 64,
    height: 40,
    textAlign: "center",
  },
  inputCompleted: { color: "#888", backgroundColor: "#222" },
  unit: { color: "#888", fontSize: 12, marginLeft: -10 },
  check: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  checkCompleted: { backgroundColor: "#4CAF50" },
});
