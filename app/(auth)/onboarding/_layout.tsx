import { Stack } from "expo-router";
import { AUTH_SCREEN_OPTIONS_RIGHT } from "@/constants/navigation";

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="location" options={AUTH_SCREEN_OPTIONS_RIGHT} />

      <Stack.Screen name="search" options={AUTH_SCREEN_OPTIONS_RIGHT} />

      <Stack.Screen name="language" options={AUTH_SCREEN_OPTIONS_RIGHT} />

      <Stack.Screen name="success" options={{ headerShown: false }} />
    </Stack>
  );
}
