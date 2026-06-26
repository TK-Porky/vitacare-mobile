/**
 * NotificationService
 *
 * Responsibilities:
 *   1. Request / verify OS notification permissions
 *   2. Register for Expo push notifications and obtain a push token
 *   3. Schedule local notifications (treatment & appointment reminders)
 *   4. Handle foreground notification events
 *   5. Persist notifications to AsyncStorage (in-app inbox)
 */

import * as ExpoNotifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type {
  VitaCareNotification,
  NotificationCategory,
  NotificationPreferences,
} from '@vitacare/shared-types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@vitacare/shared-types';

// ── Constants ─────────────────────────────────────────────────────────────
const STORAGE_KEY_INBOX        = 'vitacare:notifications:inbox';
const STORAGE_KEY_PUSH_TOKEN   = 'vitacare:notifications:pushToken';
const STORAGE_KEY_PREFERENCES  = 'vitacare:notifications:preferences';

// ── Service ───────────────────────────────────────────────────────────────

class NotificationService {
  private _pushToken: string | null = null;

  // ── Permissions & registration ─────────────────────────────────────────

  /**
   * Request permissions, register the device with Expo Push Service,
   * and persist the token.
   * Must be called early in the app lifecycle (e.g., in _layout.tsx).
   *
   * Returns the Expo push token string, or null if permissions were denied.
   */
  async register(): Promise<string | null> {
    // setNotificationHandler must be called lazily — calling it at module level
    // throws in Expo Go SDK 53+ on Android.
    try {
      ExpoNotifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch {
      console.warn('[NotificationService] setNotificationHandler not available (Expo Go).');
      return null;
    }

    let finalStatus: string;
    try {
      const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
      finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await ExpoNotifications.requestPermissionsAsync();
        finalStatus = status;
      }
    } catch {
      console.warn('[NotificationService] Permission API not available (Expo Go).');
      return null;
    }

    if (finalStatus !== 'granted') {
      console.warn('[NotificationService] Permission not granted.');
      return null;
    }

    // Android: create notification channels
    if (Platform.OS === 'android') {
      try {
        await ExpoNotifications.setNotificationChannelAsync('vitacare-default', {
          name: 'VitaCare',
          importance: ExpoNotifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0D9488',
        });
        await ExpoNotifications.setNotificationChannelAsync('vitacare-reminders', {
          name: 'Rappels',
          importance: ExpoNotifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0D9488',
        });
      } catch {
        console.warn('[NotificationService] Could not create notification channels (Expo Go).');
      }
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    try {
      const tokenData = await ExpoNotifications.getExpoPushTokenAsync({ projectId });
      this._pushToken = tokenData.data;
      await AsyncStorage.setItem(STORAGE_KEY_PUSH_TOKEN, this._pushToken);
      return this._pushToken;
    } catch {
      console.warn('[NotificationService] Could not obtain push token (requires a development build).');
      return null;
    }
  }

  get pushToken(): string | null {
    return this._pushToken;
  }

  async loadSavedToken(): Promise<string | null> {
    this._pushToken = await AsyncStorage.getItem(STORAGE_KEY_PUSH_TOKEN);
    return this._pushToken;
  }

  // ── Preferences ────────────────────────────────────────────────────────

  async getPreferences(): Promise<NotificationPreferences> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PREFERENCES);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  }

  async savePreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    const current = await this.getPreferences();
    await AsyncStorage.setItem(
      STORAGE_KEY_PREFERENCES,
      JSON.stringify({ ...current, ...prefs }),
    );
  }

  // ── Inbox (in-app notification center) ────────────────────────────────

  async getInbox(): Promise<VitaCareNotification[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_INBOX);
    if (!raw) return [];
    const list: VitaCareNotification[] = JSON.parse(raw);
    // newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addToInbox(notification: VitaCareNotification): Promise<void> {
    const inbox = await this.getInbox();
    inbox.unshift(notification);
    // Cap at 100 notifications
    await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(inbox.slice(0, 100)));
  }

  async markAsRead(id: string): Promise<void> {
    const inbox = await this.getInbox();
    const updated = inbox.map((n) =>
      n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
    );
    await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(updated));
  }

  async markAllAsRead(): Promise<void> {
    const inbox = await this.getInbox();
    const now = new Date().toISOString();
    const updated = inbox.map((n) => ({ ...n, readAt: n.readAt ?? now }));
    await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(updated));
  }

  async deleteFromInbox(id: string): Promise<void> {
    const inbox = await this.getInbox();
    await AsyncStorage.setItem(
      STORAGE_KEY_INBOX,
      JSON.stringify(inbox.filter((n) => n.id !== id)),
    );
  }

  async getUnreadCount(): Promise<number> {
    const inbox = await this.getInbox();
    return inbox.filter((n) => !n.readAt).length;
  }

  // ── Local notification scheduling ─────────────────────────────────────

  /**
   * Schedule a local notification (treatment / appointment reminder).
   * Returns the Expo notification identifier.
   */
  async schedule({
    title,
    body,
    scheduledFor,
    category,
    data = {},
  }: {
    title: string;
    body: string;
    scheduledFor: Date;
    category: NotificationCategory;
    data?: Record<string, unknown>;
  }): Promise<string> {
    const prefs = await this.getPreferences();

    // Respect user preferences
    if (category === 'appointment_reminder' && !prefs.appointmentReminders) return '';
    if (category === 'treatment_reminder'   && !prefs.treatmentReminders) return '';

    let identifier: string;
    try {
      identifier = await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { category, ...data },
          sound: true,
          ...(Platform.OS === 'android' && { channelId: 'vitacare-reminders' }),
        },
        trigger: {
          type: ExpoNotifications.SchedulableTriggerInputTypes.DATE,
          date: scheduledFor,
        },
      });
    } catch {
      console.warn('[NotificationService] scheduleNotificationAsync not available (Expo Go).');
      return '';
    }

    // Also persist to inbox
    await this.addToInbox({
      id: identifier,
      category,
      title,
      body,
      priority: 'normal',
      createdAt: new Date().toISOString(),
      scheduledFor: scheduledFor.toISOString(),
      data,
    });

    return identifier;
  }

  /** Cancel a previously scheduled notification by its identifier. */
  async cancel(identifier: string): Promise<void> {
    try {
      await ExpoNotifications.cancelScheduledNotificationAsync(identifier);
    } catch { /* Expo Go */ }
    await this.deleteFromInbox(identifier);
  }

  /** Cancel ALL scheduled notifications (e.g. on logout). */
  async cancelAll(): Promise<void> {
    try {
      await ExpoNotifications.cancelAllScheduledNotificationsAsync();
    } catch { /* Expo Go */ }
  }

  // ── Convenience schedulers ─────────────────────────────────────────────

  /** Schedule a reminder N minutes before an appointment. */
  async scheduleAppointmentReminder({
    appointmentId,
    doctorName,
    appointmentDate,
    leadTimeMinutes,
  }: {
    appointmentId: string;
    doctorName: string;
    appointmentDate: Date;
    leadTimeMinutes?: number;
  }): Promise<string> {
    const prefs = await this.getPreferences();
    const lead  = leadTimeMinutes ?? prefs.reminderLeadTimeMinutes;
    const triggerDate = new Date(appointmentDate.getTime() - lead * 60_000);

    if (triggerDate <= new Date()) return ''; // already passed

    return this.schedule({
      title: 'Rappel de rendez-vous',
      body: `Votre rendez-vous avec ${doctorName} est dans ${lead} min.`,
      scheduledFor: triggerDate,
      category: 'appointment_reminder',
      data: { appointmentId },
    });
  }

  /** Schedule a daily treatment reminder. */
  async scheduleTreatmentReminder({
    treatmentId,
    treatmentName,
    reminderTime,
  }: {
    treatmentId: string;
    treatmentName: string;
    reminderTime: Date; // only time-of-day matters; use a Date for convenience
  }): Promise<string> {
    return this.schedule({
      title: 'Rappel de traitement',
      body: `N'oubliez pas de prendre votre traitement : ${treatmentName}.`,
      scheduledFor: reminderTime,
      category: 'treatment_reminder',
      data: { treatmentId },
    });
  }

  // ── Event listeners ────────────────────────────────────────────────────

  /**
   * Listen for notifications received while the app is foregrounded.
   * Automatically saves to inbox.
   */
  addForegroundListener(
    callback?: (notification: ExpoNotifications.Notification) => void,
  ): ExpoNotifications.Subscription {
    try {
      return ExpoNotifications.addNotificationReceivedListener(async (notification) => {
        const { title, body, data } = notification.request.content;

        await this.addToInbox({
          id: notification.request.identifier,
          category: (data?.category as NotificationCategory) ?? 'system',
          title: title ?? '',
          body: body ?? '',
          priority: 'normal',
          createdAt: new Date().toISOString(),
          data: data as Record<string, unknown>,
        });

        callback?.(notification);
      });
    } catch {
      // Expo Go SDK 53+ — return a no-op subscription
      return { remove: () => {} };
    }
  }

  /**
   * Listen for taps on notifications (foreground or background).
   * Use this to deep-link into the relevant screen.
   */
  addResponseListener(
    callback: (response: ExpoNotifications.NotificationResponse) => void,
  ): ExpoNotifications.Subscription {
    try {
      return ExpoNotifications.addNotificationResponseReceivedListener(callback);
    } catch {
      return { remove: () => {} };
    }
  }
}

export const notificationService = new NotificationService();
