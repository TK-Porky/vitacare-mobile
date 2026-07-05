import { Stack } from "expo-router";
import { colors } from "@/themes";

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      {/* ── Écran principal (réservation) ── */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* ── Succès de la réservation ── */}
      <Stack.Screen
        name="booking-success"
        options={{
          presentation: "modal",
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
