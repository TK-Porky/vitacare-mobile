import {
  NotificationData,
  NotificationCategory,
  NotificationPreferences,
  NotificationMetadata,
  ReminderNotificationData,
  PaginatedResponse,
} from "@/types";

export interface DeviceInfo {
  brand: string | null;
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceType: string | null;
  isDevice: boolean;
}

export interface CachedInboxData {
  data: NotificationData[];
  timestamp: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  total: number;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  appointmentReminders: true,
  treatmentReminders: true,
  healthTips: true,
  reminderLeadTimeMinutes: 30,
  soundEnabled: true,
  vibrationEnabled: true,
};

export const STORAGE_KEYS = {
  INBOX: "vitacare:notifications:inbox",
  PUSH_TOKEN: "vitacare:notifications:pushToken",
  FCM_TOKEN: "vitacare:notifications:fcmToken",
  PREFERENCES: "vitacare:notifications:preferences",
  INBOX_CACHE: "vitacare:notifications:inbox:cache",
} as const;
