import "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "@/i18n";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import { View, ActivityIndicator, LogBox, InteractionManager } from "react-native";
import * as Device from "expo-device";
import { useEffect, useRef, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { queryClient } from "@/lib/query.client";
import { useAuthStore } from "@/store";
import { notificationService, inAppNotificationService } from "@/services/notifications";
import { useNotificationBootstrapper } from "@/hooks/useNotificationBootstrapper";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Ignore cosmetic warnings
LogBox.ignoreLogs(["Couldn't find the scrollable node handle id!"]);

// ─── Types ──────────────────────────────────────────────────────────────

interface DeviceInfo {
  brand: string | null;
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceType: string | null;
  isDevice: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Récupère les informations du device
 */
const getDeviceInfo = async (): Promise<DeviceInfo> => {
  return {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    deviceType: String(Device.deviceType),
    isDevice: Device.isDevice,
  };
};

// ─── Root Navigator ──────────────────────────────────────────────────────

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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
      <Stack.Screen name="(modals)" />
    </Stack>
  );
}

// ─── Root Layout ─────────────────────────────────────────────────────────

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const [fontsTimedOut, setFontsTimedOut] = useState(false);

  const accessToken = useAuthStore((s) => s.accessToken);

  // ─── Refs ──────────────────────────────────────────────────────────────

  const notificationListener = useRef<Notifications.Subscription>(null);
  const pendingFCM = useRef<{ token: string; deviceInfo: DeviceInfo } | null>(null);

  // ─── Effets ─────────────────────────────────────────────────────────────

  // Font loading timeout: show UI with system fonts after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => setFontsTimedOut(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const ready = loaded || fontsTimedOut;

  // Masquer le SplashScreen dès que prêt
  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // Initialisation des notifications (différée après first paint)
  useEffect(() => {
    if (!ready) return;

    InteractionManager.runAfterInteractions(async () => {
      try {
        await notificationService.register();
        const fcmToken = await notificationService.getFCMToken();
        if (fcmToken) {
          const deviceInfo = await getDeviceInfo();
          if (accessToken) {
            await notificationService.registerDevice(fcmToken, deviceInfo);
          } else {
            pendingFCM.current = { token: fcmToken, deviceInfo };
          }
        }
      } catch (error) {
        console.error("❌ Erreur d'initialisation des notifications:", error);
      }
    });
  }, [ready]);

  // Enregistrement FCM après connexion
  useEffect(() => {
    if (!accessToken || !pendingFCM.current) return;
    notificationService
      .registerDevice(pendingFCM.current.token, pendingFCM.current.deviceInfo)
      .then(() => {
        pendingFCM.current = null;
      })
      .catch((error) => {
        console.error("❌ Erreur enregistrement FCM après login:", error);
      });
  }, [accessToken]);

  // Gestionnaire notifications arrière-plan
  useEffect(() => {
    if (!ready) return;
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("📲 Notification reçue en arrière-plan:", remoteMessage);
    });
  }, [ready]);

  // Listeners de notifications
  useEffect(() => {
    if (!ready) return;

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📥 Notification reçue en foreground:", notification);

        const { title, body, data } = notification.request.content;

        inAppNotificationService.addToInbox({
          id: notification.request.identifier,
          title: title || "",
          content: body || "",
          type: (data?.type as string) || "system",
          read: false,
          createdAt: new Date().toISOString(),
        });
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, [ready]);

  if (!ready) return null;

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
