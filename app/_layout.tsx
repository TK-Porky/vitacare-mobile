import "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { getMessaging, onMessage, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "@/i18n";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import { View, ActivityIndicator, LogBox, AppState, Platform } from "react-native";
import FlashMessage, { showMessage } from "react-native-flash-message";
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
import { useAppointmentStore } from "@/store/appointment.store";
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

  // Rafraîchissement automatique quand l'app revient au premier plan
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        console.log("🔄 App au premier plan, rafraîchissement des rendez-vous...");
        useAppointmentStore.getState().fetchAppointments();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Initialisation des notifications (différée après first paint)
  useEffect(() => {
    if (!ready) return;

    const setupNotifications = async () => {
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
        setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
          console.log("📲 Notification reçue en arrière-plan:", remoteMessage);
        });
      } catch (error) {
        console.error("❌ Erreur d'initialisation des notifications:", error);
      }
    };

    const handle = typeof requestIdleCallback === "function"
      ? requestIdleCallback(() => { setupNotifications(); })
      : setTimeout(() => { setupNotifications(); }, 0);

    return () => {
      if (typeof requestIdleCallback === "function") {
        cancelIdleCallback(handle as number);
      } else {
        clearTimeout(handle as any);
      }
    };
  }, [ready]);

  // Register pending FCM token once accessToken becomes available
  useEffect(() => {
    if (!accessToken) return;
    const pending = pendingFCM.current;
    if (pending) {
      pendingFCM.current = null;
      notificationService.registerDevice(pending.token, pending.deviceInfo);
    }
  }, [accessToken]);

  // Listeners de notifications (FCM + Expo)
  useEffect(() => {
    if (!ready) return;

    const handledIds = new Set<string>();

    const expoSub = Notifications.addNotificationReceivedListener((notification) => {
      const { data } = notification.request.content;
      // Skip if already handled by FCM foreground handler (system notification posted)
      if (data?._fcmHandled) return;

      const id = notification.request.identifier;
      if (handledIds.has(id)) return;
      handledIds.add(id);

      console.log("📥 Notification expo reçue en foreground:", notification);

      const { title, body } = notification.request.content;

      showMessage({
        message: title || "Nouvelle notification",
        description: body || "",
        type: "info",
        icon: "info",
        duration: 5000,
      });

      inAppNotificationService.addToInbox({
        id,
        title: title || "",
        content: body || "",
        type: (data?.type as string) || "system",
        read: false,
        createdAt: new Date().toISOString(),
      });

      if (String(data?.type).startsWith("RDV_")) {
        useAppointmentStore.getState().incrementRefreshSignal();
      }
    });

    const fcmUnsub = onMessage(getMessaging(), (remoteMessage) => {
      const id = remoteMessage.messageId || `fcm-${Date.now()}`;
      if (handledIds.has(id)) return;
      handledIds.add(id);

      console.log("📥 Notification FCM reçue en foreground:", remoteMessage);

      const { notification, data } = remoteMessage;
      const title = ((notification?.title as string) || data?.title || "Nouvelle notification") as string;
      const body = ((notification?.body as string) || data?.body || "") as string;

      // Poster une notification système (heads-up) comme en arrière-plan
      Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, _fcmHandled: true },
          sound: true,
          ...(Platform.OS === "android" && {
            channelId: "vitacare-default",
            vibration: true,
          }),
        },
        trigger: null,
      });

      inAppNotificationService.addToInbox({
        id,
        title,
        content: body,
        type: (data?.type as string) || "system",
        read: false,
        createdAt: new Date().toISOString(),
      });

      if (String(data?.type).startsWith("RDV_")) {
        useAppointmentStore.getState().incrementRefreshSignal();
      }
    });

    return () => {
      expoSub.remove();
      fcmUnsub();
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
        <FlashMessage position="top" />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
