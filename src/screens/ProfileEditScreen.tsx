import { userService } from "@/api/userService";
import { EditorHeader } from "@/components/EditorHeader";
import { useAuthStore } from "@/store/authStore";
import {
  formatDecimalInput,
  parseDecimalInput,
  sanitizeDecimal,
} from "@/utils/numberInput";
import { useRouter } from "expo-router";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useMemo, useState } from "react";
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

const MIN_WEIGHT = 20;
const MAX_WEIGHT = 400;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Draft {
  username: string;
  email: string;
  bodyWeight: string;
}

const EMPTY_DRAFT: Draft = { username: "", email: "", bodyWeight: "" };

function validate(draft: Draft): string | null {
  if (draft.username.trim() === "") {
    return "Add meg a felhasználóneved.";
  }
  if (!EMAIL_PATTERN.test(draft.email.trim())) {
    return "Érvénytelen e-mail cím.";
  }
  if (draft.bodyWeight.trim() !== "") {
    const weight = parseDecimalInput(draft.bodyWeight);
    if (weight === null || weight < MIN_WEIGHT || weight > MAX_WEIGHT) {
      return `A testsúly ${MIN_WEIGHT} és ${MAX_WEIGHT} kg között lehet.`;
    }
  }
  return null;
}

export default function ProfileEditScreen() {
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
          bodyWeight: formatDecimalInput(me.bodyWeightKg ?? 0),
        };
        setDraft(loaded);
        setInitialDraft(loaded);
      } catch (error: any) {
        console.error(
          "Hiba a profil betöltésekor",
          error.response?.data || error.message,
        );
        if (isActive) {
          Alert.alert("Hiba", "Nem sikerült betölteni a profilt.");
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
  }, []);

  useEffect(() => {
    if (isDone) router.back();
  }, [isDone, router]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialDraft),
    [draft, initialDraft],
  );

  usePreventRemove(isDirty && !isDone, ({ data }) => {
    Alert.alert(
      "Elveted a módosításokat?",
      "A nem mentett változások elvesznek.",
      [
        { text: "Maradok", style: "cancel" },
        {
          text: "Elvetés",
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
      Alert.alert("Hibás adat", error);
      return;
    }

    const weightText = draft.bodyWeight.trim();

    setIsSaving(true);
    try {
      const updated = await userService.updateMe({
        username: draft.username.trim(),
        email: draft.email.trim().toLowerCase(),
        bodyWeightKg: weightText === "" ? null : parseDecimalInput(weightText),
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
      const message =
        error.response?.status === 409
          ? error.response?.data?.message ??
            "Ez a felhasználónév vagy e-mail már foglalt."
          : "Nem sikerült elmenteni a profilt.";
      Alert.alert("Sikertelen mentés", message);
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
        title="Profil szerkesztése"
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
          <Text style={styles.label}>FELHASZNÁLÓNÉV</Text>
          <TextInput
            style={styles.input}
            value={draft.username}
            onChangeText={(username) =>
              setDraft((current) => ({ ...current, username }))
            }
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={50}
            editable={!isSaving}
          />

          <Text style={styles.label}>E-MAIL</Text>
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

          <Text style={styles.label}>TESTSÚLY (KG)</Text>
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
            placeholder="pl. 82,5"
            placeholderTextColor="#5A5A5E"
            maxLength={6}
            editable={!isSaving}
          />
          <Text style={styles.hint}>
            Az új edzéseid ezzel a testsúllyal számolnak. A már elmentett
            edzéseket nem változtatja meg.
          </Text>
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
