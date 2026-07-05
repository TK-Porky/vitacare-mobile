import "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import { View, ActivityIndicator, LogBox } from "react-native";
import * as Device from "expo-device";
import { useEffect, useRef } from "react";
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
import { notificationService } from "@/services/notifications";
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

/**
 * Vérifie si les notifications sont autorisées
 */
const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
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

  // ─── Refs ──────────────────────────────────────────────────────────────

  const notificationListener = useRef<Notifications.Subscription>(null);
  const responseListener = useRef<Notifications.Subscription>(null);
  const notificationBootstrapped = useRef(false);

  // ─── Effets ─────────────────────────────────────────────────────────────

  // Initialisation des notifications
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Vérifier les permissions
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) {
          await Notifications.requestPermissionsAsync();
        }

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

        // Enregistrer le service de notifications
        await notificationService.register();

        // Récupérer le token FCM
        const fcmToken = await notificationService.getFCMToken();

        // Enregistrer le device (si token disponible)
        if (fcmToken) {
          const deviceInfo = await getDeviceInfo();
          await notificationService.registerDevice(fcmToken, deviceInfo);
        }

        // Configurer les catégories iOS
        await notificationService.setupNotificationCategories();

        // Configurer le handler de messages en arrière-plan (Firebase)
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
          console.log("📲 Notification reçue en arrière-plan:", remoteMessage);
        });

        notificationBootstrapped.current = true;
      } catch (error) {
        console.error("❌ Erreur d'initialisation des notifications:", error);
      }
    };

    setupNotifications();

    // Cleanup
    return () => {
      notificationBootstrapped.current = false;
    };
  }, []);

  // Listeners de notifications
  useEffect(() => {
    // Écouter les notifications reçues en foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📥 Notification reçue en foreground:", notification);

        const { title, body, data } = notification.request.content;

        // Ajouter à l'inbox
        /*
        notificationService.addToInbox({
          id: notification.request.identifier,
          title: title || "",
          content: body || "",
          type: (data?.type as string) || "system",
          read: false,
          createdAt: new Date().toISOString(),
        });
        */
      });

    // Écouter les réponses aux notifications (tap/action)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("📱 Réponse à la notification:", response);

        // Pas de délai fixe, traiter immédiatement
        notificationService.handleNotificationAction(response);
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

  // Masquer le SplashScreen quand les fonts sont chargées
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
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
