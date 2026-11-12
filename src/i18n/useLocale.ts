import { useSettingsStore } from "@/store/settingsStore";
import { useTranslation } from "react-i18next";

export function useLocale() {
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const locale = language === "en" ? "en-US" : "hu-HU";
  return { t, locale };
}
