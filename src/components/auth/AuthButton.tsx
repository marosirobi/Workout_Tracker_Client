import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
}

export function AuthButton({ title, onPress, isLoading = false }: AuthButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, isLoading && styles.buttonLoading]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FC4C02",
    borderRadius: 12,
    minHeight: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonLoading: { opacity: 0.7 },
  text: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
