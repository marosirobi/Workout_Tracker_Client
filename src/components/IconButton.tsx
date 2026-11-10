import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface IconButtonProps {
  name: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}

export function IconButton({
  name,
  onPress,
  disabled = false,
  color = "#FFF",
}: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Ionicons name={name} size={20} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.3 },
});
