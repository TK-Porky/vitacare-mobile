// app/_layout.tsx
import "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import { View, ActivityIndicator, LogBox } from "react-native";
import { useEffect, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { queryClient } from "../src/lib/query.client";
import { useAuthStore } from "../src/store";
import { notificationService } from "@/services/notification.service";
import { useNotificationBootstrapper } from "../src/hooks/useNotificationBootstrapper";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Ignore cosmetic warnings
LogBox.ignoreLogs(["Couldn't find the scrollable node handle id!"]);

/**
 * Root navigator: handles auth-based routing and registers modal screens.
 */
function RootNavigator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const segments = useSegments();

  useNotificationBootstrapper();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inMainGroup = segments[0] === "(main)";
    const inModalsGroup = segments[0] === "(modals)";
    const isOnboarding = (segments as string[])[1]?.startsWith("onboarding");

    if (!accessToken && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (accessToken && !inMainGroup && !inModalsGroup && !isOnboarding) {
      router.replace("/(main)");
    }
  }, [isHydrated, accessToken, segments]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />

      {/* Modales */}
      <Stack.Screen
        name="(modals)/notifications"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/notification-settings"
        options={{ presentation: "modal", headerShown: false }}
      />

      {/* Modal de validation de rappel */}
      <Stack.Screen
        name="(modals)/reminder-validation"
        options={{
          presentation: "transparentModal",
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  // Correction : initialiser les refs avec null
  const notificationListener = useRef<Notifications.Subscription>(null);
  const responseListener = useRef<Notifications.Subscription>(null);
  const notificationBootstrapped = useRef(false);

  // Initialisation des notifications
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Configurer les catégories de notifications (iOS)
        await notificationService.setupNotificationCategories();

        // Configurer le handler pour les notifications en foreground
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          }),
        });

        // Enregistrer le service de notifications (permissions + token)
        await notificationService.register();

        notificationBootstrapped.current = true;
        console.log("Notifications initialisées avec succès");
      } catch (error) {
        console.error("Erreur d'initialisation des notifications:", error);
      }
    };

    setupNotifications();

    //Écouter les notifications reçues en foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📥 Notification reçue en foreground:", notification);

        const { title, body, data } = notification.request.content;

        notificationService.addToInbox({
          id: notification.request.identifier,
          title: title || "",
          content: body || "",
          type: (data?.type as string) || "system",
          read: false,
          createdAt: new Date().toISOString(),
        });
      });

    //Écouter les réponses aux notifications (tap/action)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("📱 Réponse à la notification:", response);

        setTimeout(() => {
          notificationService.handleNotificationAction(response);
        }, 300);
      });

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
