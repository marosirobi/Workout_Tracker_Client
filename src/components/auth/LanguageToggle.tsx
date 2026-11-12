import { type Language, LANGUAGE_NAMES } from "@/i18n";
import { useSettingsStore } from "@/store/settingsStore";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const LANGUAGES: Language[] = ["hu", "en"];

export function LanguageToggle() {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  return (
    <View style={styles.container}>
      {LANGUAGES.map((code) => {
        const isActive = code === language;
        return (
          <TouchableOpacity
            key={code}
            style={[styles.option, isActive && styles.optionActive]}
            onPress={() => setLanguage(code)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={LANGUAGE_NAMES[code]}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>
              {code.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 3,
  },
  option: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  optionActive: { backgroundColor: "#FC4C02" },
  text: { color: "#8E8E93", fontSize: 13, fontWeight: "700" },
  textActive: { color: "#FFF" },
});
