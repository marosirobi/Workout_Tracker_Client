import { ScreenHeader } from "@/components/ScreenHeader";
import { LANGUAGE_NAMES, type Language } from "@/i18n";
import { useSettingsStore } from "@/store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LANGUAGES: Language[] = ["hu", "en"];

export default function LanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language, setLanguage } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title={t("profile.language")} onBack={() => router.back()} />

      <View style={styles.list}>
        {LANGUAGES.map((code, index) => {
          const isSelected = code === language;

          return (
            <TouchableOpacity
              key={code}
              style={[styles.row, index > 0 && styles.rowDivider]}
              onPress={() => setLanguage(code)}
            >
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {LANGUAGE_NAMES[code]}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark" size={22} color="#FC4C02" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  list: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
  },
  label: { color: "#FFF", fontSize: 16 },
  labelSelected: { fontWeight: "700" },
});
