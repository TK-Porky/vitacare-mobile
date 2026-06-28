import { create } from "zustand";
import type { NotificationData, NotificationPreferences } from "@/types";

interface NotificationState {
  inbox: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  preferences: NotificationPreferences;
  error: string | null;

  // Actions
  setInbox: (inbox: NotificationData[]) => void;
  setUnreadCount: (count: number) => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  clearError: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  inbox: [],
  unreadCount: 0,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  hasMore: true,
  preferences: {
    appointmentReminders: true,
    treatmentReminders: true,
    healthTips: true,
    reminderLeadTimeMinutes: 30,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  error: null,

  setInbox: (inbox) => set({ inbox }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  updatePreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      inbox: [],
      unreadCount: 0,
      error: null,
    }),
}));
