import type { ExerciseSet } from "@/store/workoutStore";
import {
  formatDurationInput,
  parseDurationInput,
  sanitizeDuration,
} from "@/utils/durationInput";
import {
  formatDecimalInput,
  parseDecimalInput,
  sanitizeDecimal,
  sanitizeInteger,
} from "@/utils/numberInput";
import {
  usesReps,
  usesWeight,
  weightUnitLabel,
  type TrackingType,
} from "@/utils/trackingTypes";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SetRowProps {
  set: ExerciseSet;
  trackingType: TrackingType;
  onChange: (changes: Partial<ExerciseSet>) => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
}

export function SetRow({
  set,
  trackingType,
  onChange,
  onStartTimer,
  onStopTimer,
}: SetRowProps) {
  const { t } = useTranslation();
  const [weightText, setWeightText] = useState(() =>
    formatDecimalInput(set.weight),
  );
  const [durationText, setDurationText] = useState(() =>
    formatDurationInput(set.durationSeconds ?? 0),
  );

  const isRunning = set.timerStartedAt != null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [isRunning]);

  const wasRunning = useRef(isRunning);
  useEffect(() => {
    if (wasRunning.current && !isRunning) {
      setDurationText(formatDurationInput(set.durationSeconds ?? 0));
    }
    wasRunning.current = isRunning;
  }, [isRunning, set.durationSeconds]);

  const handleWeightChange = (text: string) => {
    const clean = sanitizeDecimal(text);
    setWeightText(clean);
    onChange({ weight: parseDecimalInput(clean) ?? 0 });
  };

  const handleRepsChange = (text: string) => {
    const clean = sanitizeInteger(text);
    onChange({ reps: clean === "" ? 0 : Number(clean) });
  };

  const handleDurationChange = (text: string) => {
    const clean = sanitizeDuration(text);
    setDurationText(clean);
    onChange({ durationSeconds: parseDurationInput(clean) ?? 0 });
  };

  const toggleCompleted = () => {
    if (!set.isCompleted && isRunning) {
      onStopTimer();
    }
    onChange({ isCompleted: !set.isCompleted });
  };

  const inputStyle = [styles.input, set.isCompleted && styles.inputCompleted];
  const editable = !set.isCompleted;

  const renderDuration = () => {
    const liveSeconds = isRunning
      ? Math.max(0, Math.floor((now - (set.timerStartedAt ?? now)) / 1000))
      : 0;

    return (
      <>
        {isRunning ? (
          <View style={[styles.input, styles.durationInput, styles.running]}>
            <Text style={styles.runningText}>
              {formatDurationInput(liveSeconds) || "0:00"}
            </Text>
          </View>
        ) : (
          <TextInput
            style={[inputStyle, styles.durationInput]}
            value={durationText}
            onChangeText={handleDurationChange}
            keyboardType="numbers-and-punctuation"
            placeholder="0:00"
            placeholderTextColor="#666"
            maxLength={6}
            editable={editable}
          />
        )}
        <TouchableOpacity
          style={[
            styles.timerButton,
            isRunning && styles.timerButtonRunning,
            set.isCompleted && styles.timerButtonDisabled,
          ]}
          onPress={isRunning ? onStopTimer : onStartTimer}
          disabled={set.isCompleted}
        >
          <Ionicons name={isRunning ? "stop" : "play"} size={18} color="#FFF" />
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={styles.row}>
      <Text style={styles.setNumber}>{set.setNumber}</Text>

      {trackingType === "DURATION" ? (
        renderDuration()
      ) : (
        <>
          {usesWeight(trackingType) ? (
            <>
              <TextInput
                style={inputStyle}
                value={weightText}
                onChangeText={handleWeightChange}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#666"
                maxLength={7}
                editable={editable}
              />
              <Text style={styles.unit}>{weightUnitLabel(trackingType)}</Text>
            </>
          ) : (
            <Text style={styles.bodyweight}>{t("setHeaders.bodyweight")}</Text>
          )}

          {usesReps(trackingType) && (
            <>
              <TextInput
                style={inputStyle}
                value={set.reps ? String(set.reps) : ""}
                onChangeText={handleRepsChange}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#666"
                maxLength={4}
                editable={editable}
              />
              <Text style={styles.unit}>{t("units.reps")}</Text>
            </>
          )}
        </>
      )}

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
  bodyweight: {
    color: "#888",
    fontSize: 13,
    width: 80,
    textAlign: "center",
  },
  durationInput: { width: 110 },
  running: { justifyContent: "center", borderWidth: 1, borderColor: "#FC4C02" },
  runningText: {
    color: "#FC4C02",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  timerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FC4C02",
    justifyContent: "center",
    alignItems: "center",
  },
  timerButtonRunning: { backgroundColor: "#FF453A" },
  timerButtonDisabled: { opacity: 0.4 },
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
