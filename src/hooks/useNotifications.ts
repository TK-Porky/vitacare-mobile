import { useEffect, useRef, useState, useCallback } from "react";
import * as ExpoNotifications from "expo-notifications";
import { useRouter } from "expo-router";
import { notificationService } from "../services/notification.service";
import type { VitaCareNotification } from "@vitacare/shared-types";

interface UseNotificationsReturn {
  inbox: VitaCareNotification[];
  unreadCount: number;
  isLoading: boolean;
  pushToken: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Gère la boîte de réception des notifications (lecture, marquage, suppression).
 *
 * L'initialisation globale (permissions, canaux, push token, listeners)
 * est déjà faite par `useNotificationBootstrapper()` dans _layout.tsx.
 */
export function useNotifications(): UseNotificationsReturn {
  const [inbox, setInbox] = useState<VitaCareNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const foregroundSub = useRef<ExpoNotifications.Subscription | null>(null);
  const responseSub = useRef<ExpoNotifications.Subscription | null>(null);

  const refresh = useCallback(async () => {
    const [msgs, count] = await Promise.all([
      notificationService.getInbox(),
      notificationService.getUnreadCount(),
    ]);
    setInbox(msgs);
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      const token = await notificationService.loadSavedToken();
      if (!cancelled) setPushToken(token);
      await refresh();
      if (!cancelled) setIsLoading(false);
    }

    init();

    // Foreground: save incoming notif to inbox and refresh
    foregroundSub.current = notificationService.addForegroundListener(() => {
      refresh();
    });

    // Tapped notification: deep-link based on data.category
    responseSub.current = notificationService.addResponseListener(
      (response) => {
        const data = response.notification.request.content.data;

        notificationService
          .markAsRead(response.notification.request.identifier)
          .then(refresh);

        if (!data) return;
        switch (data.category) {
          case "appointment_reminder":
          case "appointment_confirmed":
          case "appointment_cancelled":
            router.push(`/(tabs)/appointments`);
            break;
          case "treatment_reminder":
          case "treatment_refill":
            router.push(`/(main)/(tabs)/medications`);
            break;
          default:
            router.push(`/(modals)/notifications`);
        }
      },
    );

    return () => {
      cancelled = true;
      foregroundSub.current?.remove();
      responseSub.current?.remove();
    };
  }, [refresh, router]);

  const markAsRead = useCallback(
    async (id: string) => {
      await notificationService.markAsRead(id);
      await refresh();
    },
    [refresh],
  );

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    await refresh();
  }, [refresh]);

  const deleteNotification = useCallback(
    async (id: string) => {
      await notificationService.deleteFromInbox(id);
      await refresh();
    },
    [refresh],
  );

  return {
    inbox,
    unreadCount,
    isLoading,
    pushToken,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
}
