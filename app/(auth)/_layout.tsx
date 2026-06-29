// app/(auth)/_layout.tsx
import { Stack } from "expo-router";
import {
  AUTH_SCREEN_OPTIONS,
  AUTH_SCREEN_OPTIONS_RIGHT,
  getAuthScreenOptionsWithHeader,
} from "@/constants/navigation";

export default function AuthLayout() {
  return (
    <Stack>
      {/* Écran principal */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Écrans de connexion */}
      <Stack.Screen name="login-phone" options={AUTH_SCREEN_OPTIONS} />

      <Stack.Screen name="login-email" options={AUTH_SCREEN_OPTIONS} />

      {/* Écran mot de passe oublié */}
      <Stack.Screen name="forgot-password" options={AUTH_SCREEN_OPTIONS} />

      {/* Écran OTP avec animation personnalisée */}
      <Stack.Screen
        name="otp"
        options={{
          ...AUTH_SCREEN_OPTIONS_RIGHT,
          gestureDirection: "vertical",
        }}
      />

      {/* Écran d'inscription avec header */}
      <Stack.Screen
        name="register"
        options={getAuthScreenOptionsWithHeader("Créer un compte")}
      />

      {/* Onboarding groupé */}
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}
