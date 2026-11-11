import { validateBodyWeight } from "@/utils/bodyWeight";
import { parseDecimalInput, sanitizeDecimal } from "@/utils/numberInput";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface BodyWeightModalProps {
  visible: boolean;
  isSaving: boolean;
  onSubmit: (weightKg: number) => void;
  onCancel: () => void;
}

export function BodyWeightModal({
  visible,
  isSaving,
  onSubmit,
  onCancel,
}: BodyWeightModalProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText("");
      setError(null);
    }
  }, [visible]);

  const handleSubmit = () => {
    const validationError = validateBodyWeight(text);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSubmit(parseDecimalInput(text) ?? 0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Add meg a testsúlyod</Text>
          <Text style={styles.text}>
            A testsúlyos gyakorlatok (például húzódzkodás) volumenét ebből
            számoljuk. Később a profilodban bármikor módosíthatod.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(value) => {
                setText(sanitizeDecimal(value));
                setError(null);
              }}
              keyboardType="decimal-pad"
              placeholder="pl. 82,5"
              placeholderTextColor="#5A5A5E"
              maxLength={6}
              autoFocus
              editable={!isSaving}
            />
            <Text style={styles.unit}>kg</Text>
          </View>
          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.primaryButton, isSaving && styles.disabled]}
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryText}>Mentés és indítás</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onCancel}
            disabled={isSaving}
          >
            <Text style={[styles.secondaryText, isSaving && styles.disabled]}>
              Mégsem
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  card: { backgroundColor: "#1E1E1E", borderRadius: 16, padding: 20 },
  title: { color: "#FFF", fontSize: 19, fontWeight: "800", marginBottom: 8 },
  text: { color: "#8E8E93", fontSize: 14, lineHeight: 20, marginBottom: 18 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: "#2C2C2E",
    color: "#FFF",
    fontSize: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: "center",
  },
  unit: { color: "#8E8E93", fontSize: 16, fontWeight: "600" },
  error: { color: "#FF453A", fontSize: 13, marginTop: 8 },
  primaryButton: {
    backgroundColor: "#FC4C02",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  primaryText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  secondaryButton: { alignItems: "center", paddingVertical: 14 },
  secondaryText: { color: "#8E8E93", fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
