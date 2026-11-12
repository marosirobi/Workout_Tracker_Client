import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, Ref } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface AuthTextFieldProps extends TextInputProps {
  icon: IconName;
  error?: string | null;
  isPassword?: boolean;
  ref?: Ref<TextInput>;
}

export function AuthTextField({
  icon,
  error,
  isPassword = false,
  ref,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: AuthTextFieldProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.field,
          isFocused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}
      >
        <Ionicons name={icon} size={20} color="#8E8E93" />
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor="#5A5A5E"
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
          secureTextEntry={isPassword && !isVisible}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsVisible((visible) => !visible)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={
              isVisible ? t("auth.hidePassword") : t("auth.showPassword")
            }
          >
            <Ionicons
              name={isVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#8E8E93"
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    paddingHorizontal: 14,
  },
  fieldFocused: { borderColor: "#FC4C02" },
  fieldError: { borderColor: "#FF453A" },
  input: { flex: 1, color: "#FFF", fontSize: 16, paddingVertical: 14 },
  errorText: { color: "#FF453A", fontSize: 13, marginTop: 6, marginLeft: 4 },
});
