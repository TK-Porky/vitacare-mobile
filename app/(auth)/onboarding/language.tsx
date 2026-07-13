import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import i18next from "@/i18n";
import { StepHeader, SelectOption, PrimaryButton } from "@/components";
import { colors, fontFamily, fontSize } from "@/themes";
import { useProfile } from "@/hooks";

const LANGUAGES = [
  { label: "Français", id: "fr" },
  { label: "Anglais", id: "en" },
];

export default function OnboardingLanguageScreen() {
  const { t } = useTranslation();
  const { updatePreferences, isUpdatingPreferences } = useProfile();
  const [selected, setSelected] = useState<string>("fr");

  const handleFinish = async () => {
    try {
      i18next.changeLanguage(selected);
      await updatePreferences({ language: selected });
      router.push("/(auth)/onboarding-success");
    } catch {
      router.push("/(auth)/onboarding-success");
    }
  };

  return (
    <View style={styles.root}>
      <StepHeader current={3} total={3} showSkip={false} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("onboarding.language.title")}</Text>

        <View style={styles.options}>
          {LANGUAGES.map((lang) => (
            <SelectOption
              key={lang.id}
              label={lang.label}
              selected={selected === lang.id}
              onPress={() => setSelected(lang.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={16} color={colors.ink} />
          <Text style={styles.backText}>{t("onboarding.language.back")}</Text>
        </TouchableOpacity>

        <PrimaryButton
          label={t("onboarding.language.finish")}
          isLoading={isUpdatingPreferences}
          onPress={handleFinish}
          style={styles.finishButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 24,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
  },
  options: {
    gap: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  finishButton: {
    minWidth: 140,
  },
});
