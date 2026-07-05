import { Stack } from "expo-router";
import { colors } from "@/themes";

const HEADER_OPTIONS = {
  headerShown: true,
  headerBackTitle: "Retour",
  headerStyle: {
    backgroundColor: colors.white,
  },
  headerTitleStyle: {
    color: colors.ink,
  },
  headerShadowVisible: false,
};

export default function RemindersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      {/* ── Liste des rappels ── */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* ── Détail d'un rappel ── */}
      <Stack.Screen
        name="[id]"
        options={{
          ...HEADER_OPTIONS,
          headerTitle: "Détail du rappel",
        }}
      />

      {/* ── Validation d'un rappel ── */}
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
