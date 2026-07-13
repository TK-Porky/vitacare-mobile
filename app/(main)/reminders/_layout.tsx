import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "@/themes";

export default function RemindersLayout() {
  const { t } = useTranslation();

  const HEADER_OPTIONS = {
    headerShown: true,
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
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen
        name="[id]"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: t("reminders.title"),
        }}
      />

      <Stack.Screen
        name="validate"
        options={{
          presentation: "transparentModal",
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
