import { authService } from "@/api/authService";
import { userService } from "@/api/userService";
import { ActivityCalendar } from "@/components/profile/ActivityCalendar";
import { LANGUAGE_NAMES } from "@/i18n";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { tabStyles } from "@/styles/tabScreen";
import { logger } from "@/utils/logger";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function MenuRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#FFF" />
      <Text style={styles.menuText}>{label}</Text>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color="#5A5A5E" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, clearAuth, updateUser } = useAuthStore();
  const language = useSettingsStore((state) => state.language);
  const router = useRouter();
  const [refreshSignal, setRefreshSignal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setRefreshSignal((value) => value + 1);

      userService
        .getMe()
        .then((me) => {
          if (!isActive) return;
          updateUser({
            username: me.username,
            email: me.email,
            bodyWeightKg: me.bodyWeightKg,
          });
        })
        .catch((error) =>
          logger.error("Hiba a profil betöltésekor", error),
        );

      return () => {
        isActive = false;
      };
    }, [updateUser]),
  );

  const handleLogout = () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    clearAuth();
    if (refreshToken) {
      authService
        .logout(refreshToken)
        .catch((error) =>
          logger.warn("A szerveroldali kijelentkezés nem sikerült", error),
        );
    }
  };

  const confirmLogout = () => {
    Alert.alert(t("profile.logout"), t("profile.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("profile.logout"), style: "destructive", onPress: handleLogout },
    ]);
  };

  const initial = user?.username?.charAt(0).toUpperCase() ?? "?";

  return (
    <SafeAreaView style={tabStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={tabStyles.content}>
        <Text style={tabStyles.title}>{t("profile.title")}</Text>

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.name} numberOfLines={1}>
              {user?.username}
            </Text>
            {user?.email ? (
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={tabStyles.sectionTitle}>{t("profile.activity")}</Text>
        <ActivityCalendar refreshSignal={refreshSignal} />

        <View style={styles.menu}>
          <MenuRow
            icon="create-outline"
            label={t("profile.editProfile")}
            onPress={() => router.push("/profile/edit")}
          />

          <MenuRow
            icon="lock-closed-outline"
            label={t("profile.changePassword")}
            onPress={() => router.push("/profile/password")}
          />

          <MenuRow
            icon="barbell-outline"
            label={t("profile.exercises")}
            onPress={() => router.push("/exercises")}
          />

          <MenuRow
            icon="language-outline"
            label={t("profile.language")}
            value={LANGUAGE_NAMES[language]}
            onPress={() => router.push("/profile/language")}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutText}>{t("profile.logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FC4C02",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFF", fontSize: 28, fontWeight: "800" },
  headerTexts: { flex: 1 },
  name: { color: "#FFF", fontSize: 22, fontWeight: "800" },
  email: { color: "#8E8E93", fontSize: 14, marginTop: 2 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  menuText: { flex: 1, color: "#FFF", fontSize: 16, fontWeight: "600" },
  menuValue: { color: "#8E8E93", fontSize: 15 },
  menu: { marginTop: 20 },
  logoutButton: { alignItems: "center", paddingVertical: 18, marginTop: 24 },
  logoutText: { color: "#FF453A", fontSize: 16, fontWeight: "600" },
});
