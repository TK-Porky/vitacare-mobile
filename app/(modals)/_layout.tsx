import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ presentation: "modal", headerShown: false }}>
      <Stack.Screen name="notifications" />
      <Stack.Screen
        name="reminder-validation"
        options={{
          presentation: "transparentModal",
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
