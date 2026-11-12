import { userService } from "@/api/userService";
import { EditorHeader } from "@/components/EditorHeader";
import i18n, { currentLocale } from "@/i18n";
import { useAuthStore } from "@/store/authStore";
import {
  isValidEmail,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/utils/authValidation";
import { validateBodyWeight } from "@/utils/bodyWeight";
import {
  formatDecimalInput,
  parseDecimalInput,
  sanitizeDecimal,
} from "@/utils/numberInput";
import { useRouter } from "expo-router";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Draft {
  username: string;
  email: string;
  bodyWeight: string;
}

const EMPTY_DRAFT: Draft = { username: "", email: "", bodyWeight: "" };

function validate(draft: Draft): string | null {
  const username = draft.username.trim();
  if (username === "") {
    return i18n.t("profileEdit.usernameRequired");
  }
  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    return i18n.t("auth.usernameLength", {
      min: USERNAME_MIN_LENGTH,
      max: USERNAME_MAX_LENGTH,
    });
  }
  if (!isValidEmail(draft.email.trim())) {
    return i18n.t("profileEdit.invalidEmail");
  }
  return validateBodyWeight(draft.bodyWeight);
}

export default function ProfileEditScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { setTokens, updateUser } = useAuthStore();

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [initialDraft, setInitialDraft] = useState<Draft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const me = await userService.getMe();
        if (!isActive) return;

        const loaded: Draft = {
          username: me.username,
          email: me.email,
          bodyWeight: formatDecimalInput(me.bodyWeightKg ?? 0, currentLocale()),
        };
        setDraft(loaded);
        setInitialDraft(loaded);
      } catch (error: any) {
        console.error(
          "Hiba a profil betöltésekor",
          error.response?.data || error.message,
        );
        if (isActive) {
          Alert.alert(t("common.error"), t("profileEdit.loadFailed"));
          setIsDone(true);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, [t]);

  useEffect(() => {
    if (isDone) router.back();
  }, [isDone, router]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialDraft),
    [draft, initialDraft],
  );

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

  const handleSave = async () => {
    if (!isDirty) {
      setIsDone(true);
      return;
    }

    const error = validate(draft);
    if (error) {
      Alert.alert(t("common.invalidData"), error);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await userService.updateMe({
        username: draft.username.trim(),
        email: draft.email.trim().toLowerCase(),
        bodyWeightKg: parseDecimalInput(draft.bodyWeight),
      });

      if (updated.accessToken) {
        setTokens(updated.accessToken);
      }
      updateUser({
        username: updated.username,
        email: updated.email,
        bodyWeightKg: updated.bodyWeightKg,
      });

      setIsDone(true);
    } catch (error: any) {
      console.error(
        "Hiba a profil mentésekor",
        error.response?.data || error.message,
      );
      const code = error.response?.data?.code;
      const message =
        code === "EMAIL_TAKEN"
          ? t("auth.emailTaken")
          : code === "USERNAME_TAKEN"
            ? t("auth.usernameTaken")
            : error.response?.status === 409
              ? t("profileEdit.taken")
              : t("profileEdit.saveFailed");
      Alert.alert(t("common.saveFailed"), message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC4C02" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <EditorHeader
        title={t("profile.editProfile")}
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
          <Text style={styles.label}>{t("profileEdit.username")}</Text>
          <TextInput
            style={styles.input}
            value={draft.username}
            onChangeText={(username) =>
              setDraft((current) => ({ ...current, username }))
            }
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={USERNAME_MAX_LENGTH}
            editable={!isSaving}
          />

          <Text style={styles.label}>{t("profileEdit.email")}</Text>
          <TextInput
            style={styles.input}
            value={draft.email}
            onChangeText={(email) =>
              setDraft((current) => ({ ...current, email }))
            }
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            maxLength={100}
            editable={!isSaving}
          />

          <Text style={styles.label}>{t("profileEdit.bodyWeight")}</Text>
          <TextInput
            style={styles.input}
            value={draft.bodyWeight}
            onChangeText={(text) =>
              setDraft((current) => ({
                ...current,
                bodyWeight: sanitizeDecimal(text),
              }))
            }
            keyboardType="decimal-pad"
            placeholder={t("common.weightPlaceholder")}
            placeholderTextColor="#5A5A5E"
            maxLength={6}
            editable={!isSaving}
          />
          <Text style={styles.hint}>{t("profileEdit.hint")}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  flex: { flex: 1 },
  center: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { padding: 20, paddingBottom: 40 },
  label: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "#FFF",
    fontSize: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  hint: { color: "#8E8E93", fontSize: 13, lineHeight: 18, marginTop: 8 },
});
