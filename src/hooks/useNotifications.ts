import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as ExpoNotifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { notificationService } from "@/services/notifications.service";
import type { NotificationData } from "@/types";
import { Alert } from "react-native";

interface UseNotificationsReturn {
  inbox: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  pushToken: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  clearError: () => void;
}

const PAGE_SIZE = 20;

/**
 * Initialises the notification service, listens for new notifications,
 * and provides the in-app inbox.
 *
 * Mount this hook once in the root layout.
 */
export function useNotifications(): UseNotificationsReturn {
  const { t } = useTranslation();
  const router = useRouter();

  // ── États ──────────────────────────────────────────────────────────────
  const [inbox, setInbox] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  // ── Refs ────────────────────────────────────────────────────────────────
  const foregroundSub = useRef<ExpoNotifications.Subscription | null>(null);
  const responseSub = useRef<ExpoNotifications.Subscription | null>(null);
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // ── Nettoyage ──────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
      refreshTimeout.current = null;
    }
  }, []);

  // ── Fonction de rafraîchissement ──────────────────────────────────────
  const refresh = useCallback(
    async (showLoading = false) => {
      // Éviter les appels concurrents
      if (isRefreshing) return;

      try {
        if (showLoading) {
          setIsRefreshing(true);
        }

        // Récupérer les notifications avec pagination
        const response = await notificationService.getInbox(1, PAGE_SIZE);

        // Extraire les données de la réponse paginée
        const notifications = response.data || [];
        const count = notifications.filter((n) => !n.read).length;

        // Vérifier que le composant est toujours monté
        if (isMounted) {
          setInbox(notifications);
          setUnreadCount(count);
          setHasMore(response.pagination?.hasNextPage ?? false);
          setPage(1);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err?.message || "Erreur lors du chargement des notifications",
          );
          // Ne pas vider l'inbox en cas d'erreur
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [isMounted, isRefreshing],
  );

  // ── Fonction de chargement de plus de notifications ──────────────────
  const loadMore = useCallback(async () => {
    // Vérifications avant de charger
    if (isLoadingMore || !hasMore || isRefreshing || isLoading) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const nextPage = page + 1;
      const response = await notificationService.getInbox(nextPage, PAGE_SIZE);

      // Extraire les données de la réponse paginée
      const newNotifications = response.data || [];

      if (isMounted) {
        setInbox((prev) => {
          // Éviter les doublons
          const existingIds = new Set(prev.map((n) => n.id));
          const uniqueNewNotifications = newNotifications.filter(
            (n) => !existingIds.has(n.id),
          );
          return [...prev, ...uniqueNewNotifications];
        });
        setPage(nextPage);
        setHasMore(response.pagination?.hasNextPage ?? false);
      }
    } catch (err: any) {
      if (isMounted) {
        // Ne pas afficher d'erreur bloquante pour le chargement de plus
        console.warn("Failed to load more notifications:", err);
      }
    } finally {
      if (isMounted) {
        setIsLoadingMore(false);
      }
    }
  }, [isLoadingMore, hasMore, page, isRefreshing, isLoading, isMounted]);

  // ── Initialisation ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setIsLoading(true);
        setError(null);

        // Récupérer le token sauvegardé
        const token = await notificationService.loadSavedToken();
        if (!cancelled && isMounted) {
          setPushToken(token);
        }

        // Charger les notifications
        await refresh(false);
      } catch (err: any) {
        if (!cancelled && isMounted) {
          setError(err?.message || "Erreur d'initialisation");
          setIsLoading(false);
        }
      }
    }

    init();

    // ── Foreground listener ──────────────────────────────────────────────
    foregroundSub.current = notificationService.addForegroundListener(
      (notification) => {
        // Rafraîchir avec un délai pour éviter les appels trop fréquents
        cleanup();
        refreshTimeout.current = setTimeout(() => {
          refresh(false);
        }, 500);
      },
    );

    // ── Response listener (tapped notification) ──────────────────────────
    responseSub.current = notificationService.addResponseListener(
      async (response) => {
        const data = response.notification.request.content.data;
        const notificationId = response.notification.request.identifier;

        // Marquer comme lu en arrière-plan
        try {
          await notificationService.markAsRead(notificationId);
          await refresh(false);
        } catch (err) {
          console.warn("Failed to mark notification as read:", err);
        }

        // Deep linking
        if (!data || !data.type) {
          router.push("/(modals)/notifications");
          return;
        }

        // Navigation basée sur la catégorie
        const category = data.type;
        const navigationMap: Record<string, string> = {
          appointment_reminder: "/(tabs)/appointments",
          appointment_confirmed: "/(tabs)/appointments",
          appointment_cancelled: "/(tabs)/appointments",
          treatment_reminder: "/(main)/(tabs)/medications",
          treatment_refill: "/(main)/(tabs)/medications",
          health_tip: "/(main)/(tabs)/health",
        };

        const route =
          navigationMap[category as keyof typeof navigationMap] ||
          "/(modals)/notifications";

        // Petite pause pour laisser le temps au marquage de se faire
        setTimeout(() => {
          router.push(route as never);
        }, 100);
      },
    );

    // ── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      cancelled = true;
      cleanup();
      foregroundSub.current?.remove();
      responseSub.current?.remove();
    };
  }, [refresh, router, isMounted, cleanup]);

  // ── Marquer comme lu ────────────────────────────────────────────────────
  const markAsRead = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        await notificationService.markAsRead(id);

        // Mise à jour optimiste de l'UI
        setInbox((prev) =>
          prev.map((notif) =>
            notif.id === id
              ? { ...notif, read: true, readAt: new Date().toISOString() }
              : notif,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Rafraîchir en arrière-plan pour synchroniser
        await refresh(false);
      } catch (err: any) {
        setError(err?.message || "Erreur lors du marquage");
        // Revenir à l'état précédent en cas d'erreur
        await refresh(false);
      }
    },
    [refresh],
  );

  // ── Marquer tout comme lu ──────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;

    // Confirmation utilisateur
    return new Promise<void>((resolve, reject) => {
      Alert.alert(
        t('notifications.markAllRead'),
        t('notifications.markAllReadConfirm'),
        [
          {
            text: t('common.cancel'),
            style: "cancel",
            onPress: () => reject(new Error(t('notifications.markAllReadCancel'))),
          },
          {
            text: t('common.confirm'),
            onPress: async () => {
              try {
                await notificationService.markAllAsRead();

                // Mise à jour optimiste
                setInbox((prev) =>
                  prev.map((notif) => ({
                    ...notif,
                    read: true,
                    readAt: new Date().toISOString(),
                  })),
                );
                setUnreadCount(0);

                await refresh(false);
                resolve();
              } catch (err: any) {
                setError(err?.message || "Erreur lors du marquage");
                await refresh(false);
                reject(err);
              }
            },
          },
        ],
      );
    });
  }, [unreadCount, refresh]);

  // ── Supprimer une notification ─────────────────────────────────────────
  const deleteNotification = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        // Mise à jour optimiste
        const deletedNotif = inbox.find((n) => n.id === id);
        setInbox((prev) => prev.filter((notif) => notif.id !== id));

        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        await notificationService.deleteFromInbox(id);
        await refresh(false);
      } catch (err: any) {
        setError(err?.message || "Erreur lors de la suppression");
        // Revenir à l'état précédent en cas d'erreur
        await refresh(false);
      }
    },
    [inbox, refresh],
  );

  // ── Effacer l'erreur ────────────────────────────────────────────────────
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ── Nettoyage automatique ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      setIsMounted(false);
      cleanup();
    };
  }, [cleanup]);

  // ── Valeurs retournées ────────────────────────────────────────────────
  return useMemo(
    () => ({
      inbox,
      unreadCount,
      isLoading,
      isRefreshing,
      isLoadingMore,
      hasMore,
      error,
      pushToken,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refresh: () => refresh(true),
      loadMore,
      clearError,
    }),
    [
      inbox,
      unreadCount,
      isLoading,
      isRefreshing,
      isLoadingMore,
      hasMore,
      error,
      pushToken,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refresh,
      loadMore,
      clearError,
    ],
  );
}
