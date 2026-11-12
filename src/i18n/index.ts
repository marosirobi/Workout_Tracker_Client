import "intl-pluralrules";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./en";
import { hu } from "./hu";

export type Language = "hu" | "en";

export const LANGUAGE_NAMES: Record<Language, string> = {
  hu: "Magyar",
  en: "English",
};

i18n.use(initReactI18next).init({
  resources: {
    hu: { translation: hu },
    en: { translation: en },
  },
  lng: "hu",
  fallbackLng: "hu",
  interpolation: { escapeValue: false },
});

export const currentLocale = (): string =>
  i18n.language === "en" ? "en-US" : "hu-HU";

export default i18n;
