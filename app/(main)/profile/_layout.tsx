import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "@/themes";

export default function ProfileLayout() {
  const { t } = useTranslation();

  const HEADER_OPTIONS = {
    headerShown: false,
    headerBackTitle: t("common.back"),
    headerStyle: {
      backgroundColor: colors.white,
    },
    headerTitleStyle: {
      color: colors.ink,
    },
    headerShadowVisible: false,
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen
        name="edit-profile"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("profile.editScreen.title"),
        }}
      />

      <Stack.Screen
        name="activity"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("profile.activityScreen.title"),
        }}
      />

      <Stack.Screen
        name="location"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("profile.locationScreen.title"),
        }}
      />

      <Stack.Screen
        name="downloads"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("profile.downloadsScreen.title"),
        }}
      />

      <Stack.Screen
        name="change-password"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("profile.changePasswordScreen.title"),
        }}
      />

      <Stack.Screen
        name="notifications-settings"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("profile.notificationsScreen.title"),
        }}
      />

      <Stack.Screen
        name="language-settings"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("profile.languageScreen.title"),
        }}
      />

      <Stack.Screen
        name="help"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("profile.helpScreen.title"),
        }}
      />

      <Stack.Screen
        name="terms"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("profile.termsScreen.title"),
        }}
      />

      <Stack.Screen
        name="confirm-delete"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("profile.deleteAccount"),
        }}
      />
    </Stack>
  );
}
