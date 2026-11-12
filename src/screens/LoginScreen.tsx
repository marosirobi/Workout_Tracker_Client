import { authService } from "@/api/authService";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthScreen, authStyles } from "@/components/auth/AuthScreen";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { useAuthStore } from "@/store/authStore";
import { isValidEmail } from "@/utils/authValidation";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, type TextInput, TouchableOpacity, View } from "react-native";

type Field = "email" | "password";
type FieldErrorKey =
  | "auth.emailRequired"
  | "auth.invalidEmail"
  | "auth.passwordRequired";
type FormErrorKey = "auth.wrongCredentials" | "auth.loginError";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, FieldErrorKey>>>(
    {},
  );
  const [formError, setFormError] = useState<FormErrorKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = (field: Field) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const validate = () => {
    const next: Partial<Record<Field, FieldErrorKey>> = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) next.email = "auth.emailRequired";
    else if (!isValidEmail(trimmedEmail)) next.email = "auth.invalidEmail";
    if (!password) next.password = "auth.passwordRequired";
    return next;
  };

  const handleLogin = async () => {
    if (isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      const { user, token, refreshToken } = await authService.login(
        email.trim().toLowerCase(),
        password,
      );
      setAuth(user, token, refreshToken);
    } catch (error: any) {
      console.error("Bejelentkezési hiba", error.response?.data || error.message);
      setFormError(
        error.response?.status === 401
          ? "auth.wrongCredentials"
          : "auth.loginError",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen>
      <Text style={[authStyles.title, { marginBottom: 32 }]}>
        Workout Tracker
      </Text>

      <AuthTextField
        icon="mail-outline"
        placeholder={t("auth.email")}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          clearError("email");
        }}
        error={errors.email ? t(errors.email) : null}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!isSubmitting}
      />

      <AuthTextField
        ref={passwordRef}
        icon="lock-closed-outline"
        isPassword
        placeholder={t("auth.password")}
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          clearError("password");
        }}
        error={errors.password ? t(errors.password) : null}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        editable={!isSubmitting}
      />

      {formError ? <Text style={authStyles.formError}>{t(formError)}</Text> : null}

      <AuthButton
        title={t("auth.login")}
        onPress={handleLogin}
        isLoading={isSubmitting}
      />

      <View style={authStyles.footer}>
        <Text style={authStyles.footerText}>{t("auth.noAccount")}</Text>
        <TouchableOpacity onPress={() => router.replace("/register")}>
          <Text style={authStyles.link}>{t("auth.goToRegister")}</Text>
        </TouchableOpacity>
      </View>
    </AuthScreen>
  );
}
