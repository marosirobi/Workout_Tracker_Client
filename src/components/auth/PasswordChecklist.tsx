import {
  getPasswordChecks,
  PASSWORD_MIN_LENGTH,
} from "@/utils/authValidation";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export function PasswordChecklist({ password }: { password: string }) {
  const { t } = useTranslation();
  const checks = getPasswordChecks(password);

  const items = [
    {
      key: "length",
      ok: checks.length,
      label: t("auth.passwordCheck.length", { min: PASSWORD_MIN_LENGTH }),
    },
    { key: "letter", ok: checks.letter, label: t("auth.passwordCheck.letter") },
    { key: "digit", ok: checks.digit, label: t("auth.passwordCheck.digit") },
    { key: "special", ok: checks.special, label: t("auth.passwordCheck.special") },
  ];

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.key} style={styles.row}>
          <Ionicons
            name={item.ok ? "checkmark-circle" : "ellipse-outline"}
            size={16}
            color={item.ok ? "#30D158" : "#5A5A5E"}
          />
          <Text style={[styles.label, item.ok && styles.labelOk]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: -4, marginBottom: 16, gap: 6, paddingLeft: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { color: "#8E8E93", fontSize: 13 },
  labelOk: { color: "#30D158" },
});
