import { Stack } from "expo-router";
import { colors } from "@/themes";

// ─── Options communes ────────────────────────────────────────────────────────

const HEADER_OPTIONS = {
  headerShown: false,
  headerBackTitle: "Retour",
  headerStyle: {
    backgroundColor: colors.white,
  },
  headerTitleStyle: {
    color: colors.ink,
  },
  headerShadowVisible: false,
};

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen
        name="edit-profile"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: "Modifier le profil",
        }}
      />

      <Stack.Screen
        name="activity"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: "Mon activité",
        }}
      />

      <Stack.Screen
        name="location"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: "Ma localisation",
        }}
      />

      <Stack.Screen
        name="downloads"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: "Mes téléchargements",
        }}
      />

      <Stack.Screen
        name="change-password"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: "Modifier le mot de passe",
        }}
      />

      <Stack.Screen
        name="notifications-settings"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: "Notifications",
        }}
      />

      <Stack.Screen
        name="language-settings"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: "Langue",
        }}
      />

      <Stack.Screen
        name="help"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: "Aide",
        }}
      />

      <Stack.Screen
        name="terms"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: "Conditions d'utilisation",
        }}
      />
    </Stack>
  );
}
