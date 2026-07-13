import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoNotifications from "expo-notifications";
import {
  NotificationData,
  NotificationPreferences,
  BackendPaginatedResponse,
  PaginatedResponse,
  ApiResponse,
} from "@/types";
import { useNotificationStore } from "@/store";
import { apiClient } from "@/lib";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  STORAGE_KEYS,
  CachedInboxData,
} from "./types";

const PAGE_SIZE = 20;
const CACHE_EXPIRY_MS = 5 * 60 * 1000;
const MAX_INBOX_SIZE = 100;
const NOTIFICATION_EXPIRY_DAYS = 30;

/**
 * Service de gestion des notifications in-app (inbox locale)
 * Responsable du stockage, de la récupération et de la gestion des notifications locales
 */
export class InAppNotificationService {
  private static instance: InAppNotificationService;
  private _cleanupInterval: ReturnType<typeof setInterval> | null = null;

  static getInstance(): InAppNotificationService {
    if (!InAppNotificationService.instance) {
      InAppNotificationService.instance = new InAppNotificationService();
    }
    return InAppNotificationService.instance;
  }

  // ─── Preferences ────────────────────────────────────────────────────────

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };

      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        appointmentReminders:
          typeof parsed.appointmentReminders === "boolean"
            ? parsed.appointmentReminders
            : DEFAULT_NOTIFICATION_PREFERENCES.appointmentReminders,
        treatmentReminders:
          typeof parsed.treatmentReminders === "boolean"
            ? parsed.treatmentReminders
            : DEFAULT_NOTIFICATION_PREFERENCES.treatmentReminders,
        healthTips:
          typeof parsed.healthTips === "boolean"
            ? parsed.healthTips
            : DEFAULT_NOTIFICATION_PREFERENCES.healthTips,
        reminderLeadTimeMinutes:
          typeof parsed.reminderLeadTimeMinutes === "number" &&
          parsed.reminderLeadTimeMinutes >= 5 &&
          parsed.reminderLeadTimeMinutes <= 120
            ? parsed.reminderLeadTimeMinutes
            : DEFAULT_NOTIFICATION_PREFERENCES.reminderLeadTimeMinutes,
        soundEnabled:
          typeof parsed.soundEnabled === "boolean"
            ? parsed.soundEnabled
            : DEFAULT_NOTIFICATION_PREFERENCES.soundEnabled,
        vibrationEnabled:
          typeof parsed.vibrationEnabled === "boolean"
            ? parsed.vibrationEnabled
            : DEFAULT_NOTIFICATION_PREFERENCES.vibrationEnabled,
      };
    } catch (error) {
      console.warn(
        "[InAppNotificationService] Invalid preferences data, using defaults:",
        error,
      );
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }
  }

  async savePreferences(
    prefs: Partial<NotificationPreferences>,
  ): Promise<void> {
    const current = await this.getPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(
      STORAGE_KEYS.PREFERENCES,
      JSON.stringify(updated),
    );
    useNotificationStore.getState().updatePreferences(updated);
  }

  // ─── Inbox ──────────────────────────────────────────────────────────────

  async getInbox(
    page: number = 1,
    limit: number = PAGE_SIZE,
  ): Promise<PaginatedResponse> {
    try {
      // Essayer de récupérer depuis le backend
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: "desc",
      });

      const response = await apiClient.get<BackendPaginatedResponse>(
        `/notifications?${params.toString()}`,
      );

      if (response.success && response.data) {
        const backendData = response.data;
        const items = backendData.items || [];
        const paginatedData: PaginatedResponse = {
          success: true,
          data: items,
          pagination: {
            total: backendData.total || 0,
            page: backendData.page || page,
            pageSize: backendData.pageSize || limit,
            totalPages: backendData.totalPages || 0,
            hasNextPage: backendData.hasNextPage || false,
            hasPreviousPage: backendData.hasPreviousPage || page > 1,
          },
        };

        await this.cacheInbox(paginatedData);

        if (page === 1) {
          const unreadCount = items.filter((n) => !n.read).length;
          useNotificationStore.getState().setInbox(items);
          useNotificationStore.getState().setUnreadCount(unreadCount);
        }

        return paginatedData;
      }

      // Fallback: cache local
      const cached = await this.getCachedInbox();
      if (cached) {
      if (__DEV__) console.log("[InAppNotificationService] Using cached inbox data");
      return cached;
    }

      throw new Error("No data available");
    } catch (error) {
      console.error("[InAppNotificationService] Error fetching inbox:", error);

      const cached = await this.getCachedInbox();
      if (cached) {
        if (__DEV__) console.log("[InAppNotificationService] Using cached inbox data");
        return cached;
      }

      throw error;
    }
  }

  async addToInbox(notification: NotificationData): Promise<void> {
    try {
      const inbox = await this.getInboxData();

      const existingIndex = inbox.findIndex((n) => n.id === notification.id);
      if (existingIndex !== -1) {
        inbox[existingIndex] = { ...inbox[existingIndex], ...notification };
      } else {
        inbox.unshift(notification);
      }

      inbox.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const limitedInbox = inbox.slice(0, MAX_INBOX_SIZE);
      await AsyncStorage.setItem(
        STORAGE_KEYS.INBOX,
        JSON.stringify(limitedInbox),
      );

      const unreadCount = limitedInbox.filter((n) => !n.read).length;
      useNotificationStore.getState().setInbox(limitedInbox);
      useNotificationStore.getState().setUnreadCount(unreadCount);

      await this.updateBadge();
    } catch (error) {
      console.error("[InAppNotificationService] Error adding to inbox:", error);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.patch<ApiResponse>(`/notifications/${id}/read`);

      const inbox = await this.getInboxData();
      const updated = inbox.map((n) =>
        n.id === id
          ? { ...n, read: true, readAt: new Date().toISOString() }
          : n,
      );
      await AsyncStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(updated));

      const unreadCount = updated.filter((n) => !n.read).length;
      useNotificationStore.getState().setInbox(updated);
      useNotificationStore.getState().setUnreadCount(unreadCount);

      await this.updateBadge();
    } catch (error) {
      console.error("[InAppNotificationService] Error marking as read:", error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.post<ApiResponse>("/notifications/read-all");

      const inbox = await this.getInboxData();
      const now = new Date().toISOString();
      const updated = inbox.map((n) => ({
        ...n,
        read: true,
        readAt: n.readAt ?? now,
      }));
      await AsyncStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(updated));

      useNotificationStore.getState().setInbox(updated);
      useNotificationStore.getState().setUnreadCount(0);

      await this.updateBadge();
    } catch (error) {
      console.error(
        "[InAppNotificationService] Error marking all as read:",
        error,
      );
      throw error;
    }
  }

  async deleteFromInbox(id: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse>(`/notifications/${id}`);

      const inbox = await this.getInboxData();
      const updated = inbox.filter((n) => n.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(updated));

      const unreadCount = updated.filter((n) => !n.read).length;
      useNotificationStore.getState().setInbox(updated);
      useNotificationStore.getState().setUnreadCount(unreadCount);

      await this.updateBadge();
    } catch (error) {
      console.error(
        "[InAppNotificationService] Error deleting from inbox:",
        error,
      );
      throw error;
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await apiClient.delete<ApiResponse>("/notifications");

      await AsyncStorage.removeItem(STORAGE_KEYS.INBOX);

      useNotificationStore.getState().setInbox([]);
      useNotificationStore.getState().setUnreadCount(0);

      await this.updateBadge();
    } catch (error) {
      console.error("[InAppNotificationService] Error deleting all:", error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const inbox = await this.getInboxData();
      return inbox.filter((n) => !n.read).length;
    } catch (error) {
      console.error(
        "[InAppNotificationService] Error getting unread count:",
        error,
      );
      return 0;
    }
  }

  // ─── Cache management ───────────────────────────────────────────────────

  private async getInboxData(): Promise<NotificationData[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.INBOX);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (error) {
      console.error("[InAppNotificationService] Error reading inbox:", error);
      return [];
    }
  }

  private async cacheInbox(data: PaginatedResponse): Promise<void> {
    try {
      const cacheData: CachedInboxData = {
        data: data.data,
        timestamp: Date.now(),
        page: data.pagination.page,
        pageSize: data.pagination.pageSize,
        hasNextPage: data.pagination.hasNextPage,
        total: data.pagination.total,
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.INBOX_CACHE,
        JSON.stringify(cacheData),
      );
    } catch (error) {
      console.warn("[InAppNotificationService] Failed to cache inbox:", error);
    }
  }

  private async getCachedInbox(): Promise<PaginatedResponse | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.INBOX_CACHE);
      if (!raw) return null;

      const cached: CachedInboxData = JSON.parse(raw);

      if (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
        return null;
      }

      return {
        success: true,
        data: cached.data,
        pagination: {
          total: cached.total,
          page: cached.page,
          pageSize: cached.pageSize || PAGE_SIZE,
          totalPages: Math.ceil(cached.total / (cached.pageSize || PAGE_SIZE)),
          hasNextPage: cached.hasNextPage,
          hasPreviousPage: cached.page > 1,
        },
      };
    } catch (error) {
      console.warn(
        "[InAppNotificationService] Failed to read cached inbox:",
        error,
      );
      return null;
    }
  }

  // ─── Badge management ───────────────────────────────────────────────────

  private async updateBadge(): Promise<void> {
    try {
      const unreadCount = await this.getUnreadCount();
      await ExpoNotifications.setBadgeCountAsync(unreadCount);
    } catch (error) {
      if (__DEV__) {
        console.warn(
          "[InAppNotificationService] Failed to update badge:",
          error,
        );
      }
    }
  }

  // ─── Cleanup ────────────────────────────────────────────────────────────

  startCleanupJob(): void {
    if (this._cleanupInterval) return;

    this.cleanupExpiredNotifications();

    this._cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredNotifications();
      },
      24 * 60 * 60 * 1000,
    );
  }

  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const inbox = await this.getInboxData();
      const now = Date.now();
      const expiryMs = NOTIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      const filtered = inbox.filter((n) => {
        const createdAt = new Date(n.createdAt).getTime();
        return now - createdAt < expiryMs;
      });

      if (filtered.length < inbox.length) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.INBOX,
          JSON.stringify(filtered),
        );

        const unreadCount = filtered.filter((n) => !n.read).length;
        useNotificationStore.getState().setInbox(filtered);
        useNotificationStore.getState().setUnreadCount(unreadCount);

        await this.updateBadge();
        console.log(
          `[InAppNotificationService] Cleaned up ${inbox.length - filtered.length} expired notifications`,
        );
      }
    } catch (error) {
      console.warn(
        "[InAppNotificationService] Failed to cleanup expired notifications:",
        error,
      );
    }
  }

  destroy(): void {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }
}

export const inAppNotificationService = InAppNotificationService.getInstance();
