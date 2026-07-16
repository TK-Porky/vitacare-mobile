import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/themes";

export default function MainLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.inkLight },
        }}
      >
        {/* ── Tabs group - main navigation ── */}
        <Stack.Screen name="(tabs)" />

        {/* ── Search screens ── */}
        <Stack.Screen name="explore/search" options={{ animation: "fade" }} />
        <Stack.Screen
          name="medications/search"
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="medications/categories"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="medications/categories/[category]"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="medications/all"
          options={{ animation: "slide_from_right" }}
        />

        {/* ── Modal screens ── */}
        <Stack.Screen
          name="home/map"
          options={{
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="reminders"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="booking"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inkLight,
  },
});
