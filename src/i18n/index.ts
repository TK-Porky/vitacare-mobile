import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import * as ExpoLocalization from "expo-localization";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

void i18next.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: ExpoLocalization.getLocales()?.[0]?.languageCode ?? "fr",
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v4",
});

export default i18next;
