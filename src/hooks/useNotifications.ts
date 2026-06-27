import { useEffect, useState, useCallback } from 'react';
import { notificationService } from '../services/notification.service';
import type { VitaCareNotification } from '@vitacare/shared-types';

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

    return () => { cancelled = true; };
  }, [refresh]);

  const markAsRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id);
    await refresh();
  }, [refresh]);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    await refresh();
  }, [refresh]);

  const deleteNotification = useCallback(async (id: string) => {
    await notificationService.deleteFromInbox(id);
    await refresh();
  }, [refresh]);

  return { inbox, unreadCount, isLoading, pushToken, markAsRead, markAllAsRead, deleteNotification, refresh };
}
