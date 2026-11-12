import { authService } from "@/api/authService";
import {
  checkPassword,
  isValidEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/utils/authValidation";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    const trimmedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedUsername || !normalizedEmail || !password) {
      Alert.alert(t("common.error"), t("auth.fillAll"));
      return;
    }
    if (
      trimmedUsername.length < USERNAME_MIN_LENGTH ||
      trimmedUsername.length > USERNAME_MAX_LENGTH
    ) {
      Alert.alert(
        t("common.error"),
        t("auth.usernameLength", {
          min: USERNAME_MIN_LENGTH,
          max: USERNAME_MAX_LENGTH,
        }),
      );
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert(t("common.error"), t("auth.invalidEmail"));
      return;
    }
    const passwordProblem = checkPassword(password);
    if (passwordProblem) {
      Alert.alert(
        t("common.error"),
        t(`auth.passwordProblem.${passwordProblem}`, {
          min: PASSWORD_MIN_LENGTH,
          max: PASSWORD_MAX_LENGTH,
        }),
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordMismatch"));
      return;
    }

    try {
      await authService.register(trimmedUsername, normalizedEmail, password);
      Alert.alert(t("auth.registerSuccessTitle"), t("auth.registerSuccess"));
    } catch (error: any) {
      const code = error.response?.data?.code;
      const message =
        code === "EMAIL_TAKEN"
          ? t("auth.emailTaken")
          : code === "USERNAME_TAKEN"
            ? t("auth.usernameTaken")
            : t("auth.registerError");
      Alert.alert(t("auth.registerFailed"), message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth.register")}</Text>
      <TextInput
        style={styles.input}
        value={username}
        placeholder={t("auth.username")}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={email}
        placeholder={t("auth.email")}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        value={password}
        placeholder={t("auth.password")}
        onChangeText={setPassword}
        secureTextEntry={true}
      />
      <Text style={styles.hint}>
        {t("auth.passwordHint", { min: PASSWORD_MIN_LENGTH })}
      </Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        placeholder={t("auth.confirmPassword")}
        onChangeText={setConfirmPassword}
        secureTextEntry={true}
      />

      <TouchableOpacity onPress={handleRegister} style={styles.button}>
        <Text style={styles.buttonText}>{t("auth.register")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/login")}
        style={styles.button}
      >
        <Text style={styles.linkButton}>{t("common.back")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#333",
  },
  input: {
    backgroundColor: "#949697",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  hint: { color: "#666", fontSize: 13, marginTop: -8, marginBottom: 15 },
  linkButton: { alignItems: "center", padding: 10 },
  linkText: { color: "#007BFF", fontSize: 16, fontWeight: "600" },
});
