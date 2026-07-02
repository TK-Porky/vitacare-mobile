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

        {/* ── Modal screens ── */}
        <Stack.Screen
          name="home/map"
          options={{
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="medications/reminders"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="booking/index"
          options={{ animation: "slide_from_right" }}
        />

        {/* ── Reminder detail & validation screens ── */}
        <Stack.Screen
          name="medications/reminders/[id]"
          options={{
            animation: "slide_from_right",
            headerShown: false,
            headerTitle: "Détail du rappel",
            headerBackTitle: "Retour",
            headerStyle: {
              backgroundColor: colors.white,
            },
            headerTitleStyle: {
              color: colors.ink,
            },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="medications/reminders/validate"
          options={{
            presentation: "transparentModal",
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />

        {/* ── Profile sub-screens ── */}
        <Stack.Screen
          name="profile/activity"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/location"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/downloads"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/help"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/terms"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/notifications-settings"
          options={{ animation: "slide_from_right" }}
        />

        {/* ── Booking success ── */}
        <Stack.Screen
          name="booking/booking-success"
          options={{
            presentation: "modal",
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
