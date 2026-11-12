import { authService } from "@/api/authService";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthScreen, authStyles } from "@/components/auth/AuthScreen";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { useAuthStore } from "@/store/authStore";
import {
  checkPassword,
  isValidEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type PasswordProblem,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/utils/authValidation";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, type TextInput, TouchableOpacity, View } from "react-native";

type Field = "username" | "email" | "password" | "confirmPassword";
type FieldErrorKey =
  | "auth.usernameRequired"
  | "auth.usernameLength"
  | "auth.usernameTaken"
  | "auth.emailRequired"
  | "auth.invalidEmail"
  | "auth.emailTaken"
  | "auth.confirmRequired"
  | "auth.passwordMismatch"
  | `auth.passwordProblem.${PasswordProblem}`;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, FieldErrorKey>>>(
    {},
  );
  const [hasFormError, setHasFormError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = (field: Field) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setHasFormError(false);
  };

  const errorText = (field: Field) => {
    const key = errors[field];
    if (!key) return null;
    return field === "username"
      ? t(key, { min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH })
      : t(key, { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH });
  };

  const validate = () => {
    const next: Partial<Record<Field, FieldErrorKey>> = {};

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      next.username = "auth.usernameRequired";
    } else if (
      trimmedUsername.length < USERNAME_MIN_LENGTH ||
      trimmedUsername.length > USERNAME_MAX_LENGTH
    ) {
      next.username = "auth.usernameLength";
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) next.email = "auth.emailRequired";
    else if (!isValidEmail(trimmedEmail)) next.email = "auth.invalidEmail";

    const passwordProblem = checkPassword(password);
    if (passwordProblem) {
      next.password = `auth.passwordProblem.${passwordProblem}`;
    }

    if (!confirmPassword) next.confirmPassword = "auth.confirmRequired";
    else if (confirmPassword !== password) {
      next.confirmPassword = "auth.passwordMismatch";
    }

    return next;
  };

  const handleRegister = async () => {
    if (isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setHasFormError(false);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      const { user, token, refreshToken } = await authService.register(
        username.trim(),
        email.trim().toLowerCase(),
        password,
      );
      setAuth(user, token, refreshToken);
    } catch (error: any) {
      console.error("Regisztrációs hiba", error.response?.data || error.message);
      const code = error.response?.data?.code;
      if (code === "EMAIL_TAKEN") {
        setErrors({ email: "auth.emailTaken" });
      } else if (code === "USERNAME_TAKEN") {
        setErrors({ username: "auth.usernameTaken" });
      } else {
        setHasFormError(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen>
      <Text style={authStyles.title}>{t("auth.createAccount")}</Text>
      <Text style={authStyles.subtitle}>{t("auth.createAccountSubtitle")}</Text>

      <AuthTextField
        icon="person-outline"
        placeholder={t("auth.username")}
        value={username}
        onChangeText={(value) => {
          setUsername(value);
          clearError("username");
        }}
        error={errorText("username")}
        maxLength={USERNAME_MAX_LENGTH}
        autoComplete="username-new"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
        editable={!isSubmitting}
      />

      <AuthTextField
        ref={emailRef}
        icon="mail-outline"
        placeholder={t("auth.email")}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          clearError("email");
        }}
        error={errorText("email")}
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
        error={errorText("password")}
        maxLength={PASSWORD_MAX_LENGTH}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => confirmRef.current?.focus()}
        editable={!isSubmitting}
      />
      <PasswordChecklist password={password} />

      <AuthTextField
        ref={confirmRef}
        icon="lock-closed-outline"
        isPassword
        placeholder={t("auth.confirmPassword")}
        value={confirmPassword}
        onChangeText={(value) => {
          setConfirmPassword(value);
          clearError("confirmPassword");
        }}
        error={errorText("confirmPassword")}
        maxLength={PASSWORD_MAX_LENGTH}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleRegister}
        editable={!isSubmitting}
      />

      {hasFormError ? (
        <Text style={authStyles.formError}>{t("auth.registerError")}</Text>
      ) : null}

      <AuthButton
        title={t("auth.register")}
        onPress={handleRegister}
        isLoading={isSubmitting}
      />

      <View style={authStyles.footer}>
        <Text style={authStyles.footerText}>{t("auth.haveAccount")}</Text>
        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={authStyles.link}>{t("auth.login")}</Text>
        </TouchableOpacity>
      </View>
    </AuthScreen>
  );
}
