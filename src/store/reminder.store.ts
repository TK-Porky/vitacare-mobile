import { create } from "zustand";
import { reminderService } from "../services/reminder.service";
import { NotificationResponse } from "../types/api-responses";
import { UpdateNotificationPreferencesRequest, MarkNotificationsReadRequest } from "../types/api-requests";

interface ReminderState {
  notifications: NotificationResponse[];
  preferences: UpdateNotificationPreferencesRequest | null;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (data?: MarkNotificationsReadRequest) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: UpdateNotificationPreferencesRequest) => Promise<void>;
  registerDevice: (token: string, platform: 'ios' | 'android') => Promise<void>;
  clearError: () => void;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  notifications: [],
  preferences: null,
  isLoading: false,
  error: null,
  unreadCount: 0,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await reminderService.getNotifications();
      const notifications = response.data ?? [];
      set({ 
        notifications,
        unreadCount: notifications.filter(n => !n.read).length
      });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (data) => {
    try {
      await reminderService.markAsRead(data);
      if (!data?.notificationIds) {
        // All read
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }));
      } else {
        // Specific ones read
        set((state) => {
          const updated = state.notifications.map(n => 
            data.notificationIds!.includes(n.id) ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter(n => !n.read).length
          };
        });
      }
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchPreferences: async () => {
    set({ isLoading: true, error: null });
    try {
      const preferences = await reminderService.getPreferences();
      set({ preferences });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updatePreferences: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await reminderService.updatePreferences(data);
      set({ preferences: data });
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  registerDevice: async (token, platform) => {
    try {
      await reminderService.registerDevice(token, platform);
    } catch (e: any) {
      console.error("Failed to register device", e);
    }
  },

  clearError: () => set({ error: null }),
}));
