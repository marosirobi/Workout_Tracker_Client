import { userService } from "@/api/userService";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { EditorHeader } from "@/components/EditorHeader";
import { useAuthStore } from "@/store/authStore";
import {
  checkPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/utils/authValidation";
import { logger } from "@/utils/logger";
import { useRouter } from "expo-router";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const setTokens = useAuthStore((state) => state.setTokens);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const isDirty =
    currentPassword !== "" || newPassword !== "" || confirmPassword !== "";

  useEffect(() => {
    if (isDone) router.back();
  }, [isDone, router]);

  usePreventRemove(isDirty && !isDone, ({ data }) => {
    Alert.alert(
      t("common.discardChangesTitle"),
      t("common.discardChangesMessage"),
      [
        { text: t("common.stay"), style: "cancel" },
        {
          text: t("common.discard"),
          style: "destructive",
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });

  const validate = (): string | null => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return t("auth.fillAll");
    }
    const problem = checkPassword(newPassword);
    if (problem) {
      return t(`auth.passwordProblem.${problem}`, {
        min: PASSWORD_MIN_LENGTH,
        max: PASSWORD_MAX_LENGTH,
      });
    }
    if (newPassword !== confirmPassword) {
      return t("auth.passwordMismatch");
    }
    if (newPassword === currentPassword) {
      return t("changePassword.samePassword");
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      Alert.alert(t("common.invalidData"), error);
      return;
    }

    setIsSaving(true);
    try {
      const tokens = await userService.changePassword(
        currentPassword,
        newPassword,
      );
      setTokens(tokens.token, tokens.refreshToken);
      Alert.alert(t("changePassword.successTitle"), t("changePassword.success"));
      setIsDone(true);
    } catch (error: any) {
      logger.error("Hiba a jelszó módosításakor", error);
      const code = error.response?.data?.code;
      const message =
        code === "WRONG_CURRENT_PASSWORD"
          ? t("changePassword.wrongCurrent")
          : code === "SAME_PASSWORD"
            ? t("changePassword.samePassword")
            : t("changePassword.failed");
      Alert.alert(t("common.saveFailed"), message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <EditorHeader
        title={t("profile.changePassword")}
        onCancel={() => router.back()}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>{t("changePassword.currentPassword")}</Text>
          <AuthTextField
            icon="lock-closed-outline"
            isPassword
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoComplete="current-password"
            textContentType="password"
            editable={!isSaving}
          />

          <Text style={styles.label}>{t("changePassword.newPassword")}</Text>
          <AuthTextField
            icon="lock-closed-outline"
            isPassword
            value={newPassword}
            onChangeText={setNewPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={PASSWORD_MAX_LENGTH}
            editable={!isSaving}
          />
          <PasswordChecklist password={newPassword} />

          <Text style={styles.label}>{t("changePassword.confirmPassword")}</Text>
          <AuthTextField
            icon="lock-closed-outline"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={PASSWORD_MAX_LENGTH}
            editable={!isSaving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  label: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
});
