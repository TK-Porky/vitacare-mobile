// services/notification.service.ts
import * as ExpoNotifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Platform, Alert } from "react-native";
import {
  NotificationData,
  NotificationCategory,
  NotificationPreferences,
  NotificationMetadata,
  ReminderNotificationData,
  PaginatedResponse,
  ApiResponse,
  BackendPaginatedResponse,
} from "@/types";
import { apiClient } from "@/lib";
import { useNotificationStore } from "@/store";

// ── Constants ─────────────────────────────────────────────────────────────
const STORAGE_KEY_INBOX = "vitacare:notifications:inbox";
const STORAGE_KEY_PUSH_TOKEN = "vitacare:notifications:pushToken";
const STORAGE_KEY_PREFERENCES = "vitacare:notifications:preferences";
const STORAGE_KEY_INBOX_CACHE = "vitacare:notifications:inbox:cache";
const PAGE_SIZE = 20;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_INBOX_SIZE = 100;
const NOTIFICATION_EXPIRY_DAYS = 30;

// ── Default preferences ──────────────────────────────────────────────────

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  appointmentReminders: true,
  treatmentReminders: true,
  healthTips: true,
  reminderLeadTimeMinutes: 30,
  soundEnabled: true,
  vibrationEnabled: true,
};

// ── Cache interface ──────────────────────────────────────────────────────

interface CachedInboxData {
  data: NotificationData[];
  timestamp: number;
  page: number;
  hasNextPage: boolean;
  total: number;
}

// ── Service ───────────────────────────────────────────────────────────────

class NotificationService {
  private static instance: NotificationService;
  private _pushToken: string | null = null;
  private _isRegistered = false;
  private _cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ── Permissions & registration ─────────────────────────────────────────

  async register(): Promise<string | null> {
    if (this._isRegistered) {
      return this._pushToken;
    }

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
      console.warn(
        "[NotificationService] setNotificationHandler not available (Expo Go).",
      );
      return null;
    }

    let finalStatus: string;
    try {
      const { status: existingStatus } =
        await ExpoNotifications.getPermissionsAsync();
      finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await ExpoNotifications.requestPermissionsAsync();
        finalStatus = status;
      }
    } catch {
      console.warn(
        "[NotificationService] Permission API not available (Expo Go).",
      );
      return null;
    }

    if (finalStatus !== "granted") {
      console.warn("[NotificationService] Permission not granted.");
      return null;
    }

    if (Platform.OS === "android") {
      try {
        await ExpoNotifications.setNotificationChannelAsync(
          "vitacare-default",
          {
            name: "VitaCare",
            importance: ExpoNotifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#0D9488",
          },
        );
        await ExpoNotifications.setNotificationChannelAsync(
          "vitacare-reminders",
          {
            name: "Rappels",
            importance: ExpoNotifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#0D9488",
          },
        );
      } catch {
        console.warn(
          "[NotificationService] Could not create notification channels (Expo Go).",
        );
      }
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    try {
      const tokenData = await ExpoNotifications.getExpoPushTokenAsync({
        projectId,
      });
      this._pushToken = tokenData.data;
      await AsyncStorage.setItem(STORAGE_KEY_PUSH_TOKEN, this._pushToken);
      this._isRegistered = true;

      await this.setupNotificationCategories();

      this.startCleanupJob();

      return this._pushToken;
    } catch {
      console.warn(
        "[NotificationService] Could not obtain push token (requires a development build).",
      );
      return null;
    }
  }

  // ── Gestion des notifications de rappel ──────────────────────────────

  handleReminderNotification(data: ReminderNotificationData): void {
    console.log("🔔 Notification de rappel ouverte:", data);

    if (!data.reminderId) {
      console.warn("❌ Pas de reminderId dans la notification");
      return;
    }

    router.push({
      pathname: "/(modals)/reminder-validation",
      params: {
        reminderId: data.reminderId,
        medicationName: data.medicationName || "Médicament",
        dosage: data.dosage || "",
        scheduledTime: data.scheduledTime || new Date().toISOString(),
        fromNotification: "true",
      },
    });
  }

  /**
   * Programme une notification de rappel avec actions
   */
  async scheduleReminderNotification(
    reminderId: string,
    medicationName: string,
    dosage: string,
    scheduledTime: Date,
  ): Promise<string | null> {
    try {
      let triggerDate = scheduledTime;
      if (triggerDate <= new Date()) {
        console.warn(
          "⏰ La date de rappel est déjà passée, reprogrammation...",
        );
        triggerDate = new Date(Date.now() + 60 * 1000);
      }

      console.log(
        `📅 Programmation du rappel pour: ${triggerDate.toLocaleString()}`,
      );

      // ✅ Correction: actions doit être au niveau du contenu, mais Expo ne supporte pas actions sur Android
      // Les actions sont gérées via les catégories iOS ou via la réponse à la notification
      const identifier = await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title: "💊 Rappel de médicament",
          body: `N'oubliez pas de prendre ${medicationName}${dosage ? ` (${dosage})` : ""}`,
          data: {
            reminderId,
            medicationName,
            dosage,
            scheduledTime: triggerDate.toISOString(),
            type: "treatment_reminder",
          },
          sound: true,
          priority: ExpoNotifications.AndroidNotificationPriority.HIGH,
          // ✅ categoryIdentifier est supporté sur iOS et Android (Expo)
          categoryIdentifier: "reminder",
        },
        trigger: {
          type: ExpoNotifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      console.log(`✅ Notification programmée: ${identifier}`);
      return identifier;
    } catch (error) {
      console.error("❌ Erreur de programmation:", error);
      return null;
    }
  }

  /**
   * Configure les catégories de notifications pour iOS
   */
  async setupNotificationCategories(): Promise<void> {
    if (Platform.OS === "ios") {
      try {
        // ✅ Correction: utiliser setNotificationCategoryAsync avec les bonnes options
        await ExpoNotifications.setNotificationCategoryAsync("reminder", [
          {
            identifier: "take",
            buttonTitle: "✅ Pris",
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: "snooze",
            buttonTitle: "⏰ Snooze 15min",
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: "skip",
            buttonTitle: "❌ Ignorer",
            options: {
              isDestructive: true,
              isAuthenticationRequired: false,
            },
          },
        ]);
        console.log("✅ Catégories de notification configurées");
      } catch (error) {
        console.error("❌ Erreur de configuration des catégories:", error);
      }
    }
  }

  /**
   * Gère les actions des notifications
   */
  async handleNotificationAction(
    response: ExpoNotifications.NotificationResponse,
  ): Promise<void> {
    const { actionIdentifier, notification } = response;

    // ✅ Correction: typer correctement les données avec un cast sécurisé
    const data = notification.request.content.data as Record<string, unknown>;

    // ✅ Construction sécurisée de ReminderNotificationData
    const reminderData: ReminderNotificationData = {
      reminderId: (data.reminderId as string) || "",
      medicationName: (data.medicationName as string) || "Médicament",
      dosage: (data.dosage as string) || "",
      scheduledTime: (data.scheduledTime as string) || new Date().toISOString(),
      action: (actionIdentifier as "take" | "snooze" | "skip") || undefined,
    };

    console.log(`📱 Action de notification: ${actionIdentifier}`, reminderData);

    if (!reminderData.reminderId) {
      console.warn("⚠️ Pas de reminderId dans la notification");
      router.push("/(main)/(tabs)/medications");
      return;
    }

    switch (actionIdentifier) {
      case "take":
        await this.handleTakeAction(reminderData);
        break;
      case "snooze":
        await this.handleSnoozeAction(reminderData);
        break;
      case "skip":
        await this.handleSkipAction(reminderData);
        break;
      default:
        this.handleReminderNotification(reminderData);
        break;
    }
  }

  private async handleTakeAction(
    data: ReminderNotificationData,
  ): Promise<void> {
    console.log("✅ Prise confirmée:", data.reminderId);

    try {
      const response = await apiClient.patch<ApiResponse>(
        `/reminders/${data.reminderId}/take`,
        {
          takenAt: new Date().toISOString(),
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Erreur lors du marquage");
      }

      await this.cancel(data.reminderId);

      Alert.alert(
        "✅ Prise confirmée",
        `${data.medicationName} a été marqué comme pris.`,
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("❌ Erreur:", error);
      Alert.alert("Erreur", "Impossible de marquer le rappel comme pris.");
    }
  }

  private async handleSnoozeAction(
    data: ReminderNotificationData,
  ): Promise<void> {
    console.log("⏰ Snooze:", data.reminderId);

    try {
      const response = await apiClient.patch<ApiResponse>(
        `/reminders/${data.reminderId}/snooze`,
        {
          minutes: 15,
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Erreur lors du report");
      }

      await ExpoNotifications.cancelScheduledNotificationAsync(data.reminderId);

      const newTime = new Date(Date.now() + 15 * 60 * 1000);
      await this.scheduleReminderNotification(
        data.reminderId,
        data.medicationName,
        data.dosage,
        newTime,
      );

      Alert.alert("⏰ Rappel reporté", `Vous serez notifié dans 15 minutes.`, [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("❌ Erreur de snooze:", error);
      Alert.alert("Erreur", "Impossible de reporter le rappel.");
    }
  }

  private async handleSkipAction(
    data: ReminderNotificationData,
  ): Promise<void> {
    console.log("❌ Ignoré:", data.reminderId);

    try {
      const response = await apiClient.patch<ApiResponse>(
        `/reminders/${data.reminderId}/skip`,
      );

      if (!response.success) {
        throw new Error(response.message || "Erreur lors de l'ignorance");
      }

      await this.cancel(data.reminderId);

      Alert.alert(
        "❌ Rappel ignoré",
        `Le rappel pour ${data.medicationName} a été ignoré.`,
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("❌ Erreur:", error);
      Alert.alert("Erreur", "Impossible d'ignorer le rappel.");
    }
  }

  // ── Getters ─────────────────────────────────────────────────────────────

  get pushToken(): string | null {
    return this._pushToken;
  }

  async loadSavedToken(): Promise<string | null> {
    this._pushToken = await AsyncStorage.getItem(STORAGE_KEY_PUSH_TOKEN);
    return this._pushToken;
  }

  // ── Preferences ────────────────────────────────────────────────────────

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_PREFERENCES);
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
        "[NotificationService] Invalid preferences data, using defaults:",
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
      STORAGE_KEY_PREFERENCES,
      JSON.stringify(updated),
    );
    useNotificationStore.getState().updatePreferences(updated);
  }

  // ── Inbox ──────────────────────────────────────────────────────────────

  async getInbox(
    page: number = 1,
    limit: number = PAGE_SIZE,
  ): Promise<PaginatedResponse> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: "desc",
      });

      const response = await apiClient.get<BackendPaginatedResponse>(
        `/notifications?${params.toString()}`,
      );

      if (!response.success) {
        console.log(response);
        throw new Error(response.message || "Failed to fetch notifications");
      }

      const backendData = response.data;

      if (!backendData) {
        throw new Error("No data in response");
      }

      const {
        items = [],
        total = 0,
        page: currentPage = page,
        pageSize = limit,
        totalPages = 0,
        hasNextPage = false,
        hasPreviousPage = false,
      } = backendData;

      const paginatedData: PaginatedResponse = {
        success: true,
        data: items,
        pagination: {
          total: total,
          page: currentPage,
          pageSize: pageSize,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPreviousPage: hasPreviousPage,
        },
      };

      await this.cacheInbox(paginatedData);

      if (page === 1) {
        const unreadCount = paginatedData.data.filter((n) => !n.read).length;
        useNotificationStore.getState().setInbox(paginatedData.data);
        useNotificationStore.getState().setUnreadCount(unreadCount);
      } else {
        const currentInbox = useNotificationStore.getState().inbox;
        const combined = [...currentInbox, ...paginatedData.data];
        const unique = combined.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.id === item.id),
        );
        useNotificationStore.getState().setInbox(unique);
      }

      return paginatedData;
    } catch (error) {
      console.error("[NotificationService] Error fetching inbox:", error);

      const cached = await this.getCachedInbox();
      if (cached) {
        console.log("[NotificationService] Using cached inbox data");
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
        STORAGE_KEY_INBOX,
        JSON.stringify(limitedInbox),
      );

      const unreadCount = limitedInbox.filter((n) => !n.read).length;
      useNotificationStore.getState().setInbox(limitedInbox);
      useNotificationStore.getState().setUnreadCount(unreadCount);

      await this.updateBadge();
    } catch (error) {
      console.error("[NotificationService] Error adding to inbox:", error);
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
      await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(updated));

      const unreadCount = updated.filter((n) => !n.read).length;
      useNotificationStore.getState().setInbox(updated);
      useNotificationStore.getState().setUnreadCount(unreadCount);

      await this.updateBadge();
    } catch (error) {
      console.error("[NotificationService] Error marking as read:", error);
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
      await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(updated));

      useNotificationStore.getState().setInbox(updated);
      useNotificationStore.getState().setUnreadCount(0);

      await this.updateBadge();
    } catch (error) {
      console.error("[NotificationService] Error marking all as read:", error);
      throw error;
    }
  }

  async deleteFromInbox(id: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse>(`/notifications/${id}`);

      const inbox = await this.getInboxData();
      const updated = inbox.filter((n) => n.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(updated));

      const unreadCount = updated.filter((n) => !n.read).length;
      useNotificationStore.getState().setInbox(updated);
      useNotificationStore.getState().setUnreadCount(unreadCount);

      await this.updateBadge();
    } catch (error) {
      console.error("[NotificationService] Error deleting from inbox:", error);
      throw error;
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await apiClient.delete<ApiResponse>("/notifications");

      await AsyncStorage.removeItem(STORAGE_KEY_INBOX);

      useNotificationStore.getState().setInbox([]);
      useNotificationStore.getState().setUnreadCount(0);

      await this.updateBadge();
    } catch (error) {
      console.error("[NotificationService] Error deleting all:", error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const inbox = await this.getInboxData();
      return inbox.filter((n) => !n.read).length;
    } catch (error) {
      console.error("[NotificationService] Error getting unread count:", error);
      return 0;
    }
  }

  // ── Cache management ───────────────────────────────────────────────────

  private async getInboxData(): Promise<NotificationData[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_INBOX);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (error) {
      console.error("[NotificationService] Error reading inbox:", error);
      return [];
    }
  }

  private async cacheInbox(data: PaginatedResponse): Promise<void> {
    try {
      const cacheData: CachedInboxData = {
        data: data.data,
        timestamp: Date.now(),
        page: data.pagination.page,
        hasNextPage: data.pagination.hasNextPage,
        total: data.pagination.total,
      };
      await AsyncStorage.setItem(
        STORAGE_KEY_INBOX_CACHE,
        JSON.stringify(cacheData),
      );
    } catch (error) {
      console.warn("[NotificationService] Failed to cache inbox:", error);
    }
  }

  private async getCachedInbox(): Promise<PaginatedResponse | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_INBOX_CACHE);
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
          pageSize: PAGE_SIZE,
          totalPages: Math.ceil(cached.total / PAGE_SIZE),
          hasNextPage: cached.hasNextPage,
          hasPreviousPage: cached.page > 1,
        },
      };
    } catch (error) {
      console.warn("[NotificationService] Failed to read cached inbox:", error);
      return null;
    }
  }

  // ── Badge management ───────────────────────────────────────────────────

  private async updateBadge(): Promise<void> {
    try {
      const unreadCount = await this.getUnreadCount();
      await ExpoNotifications.setBadgeCountAsync(unreadCount);
    } catch (error) {
      if (__DEV__) {
        console.warn("[NotificationService] Failed to update badge:", error);
      }
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────

  private startCleanupJob(): void {
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
        await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(filtered));

        const unreadCount = filtered.filter((n) => !n.read).length;
        useNotificationStore.getState().setInbox(filtered);
        useNotificationStore.getState().setUnreadCount(unreadCount);

        await this.updateBadge();
        console.log(
          `[NotificationService] Cleaned up ${inbox.length - filtered.length} expired notifications`,
        );
      }
    } catch (error) {
      console.warn(
        "[NotificationService] Failed to cleanup expired notifications:",
        error,
      );
    }
  }

  // ── Local notification scheduling ─────────────────────────────────────

  async schedule({
    title,
    body,
    scheduledFor,
    type,
    metadata = {},
  }: {
    title: string;
    body: string;
    scheduledFor: Date;
    type: NotificationCategory;
    metadata?: NotificationMetadata;
  }): Promise<string | null> {
    const prefs = await this.getPreferences();

    if (type === "appointment_reminder" && !prefs.appointmentReminders)
      return null;
    if (type === "treatment_reminder" && !prefs.treatmentReminders) return null;
    if (type === "health_tip" && !prefs.healthTips) return null;

    let identifier: string;
    try {
      identifier = await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type, ...metadata },
          sound: prefs.soundEnabled,
          ...(Platform.OS === "android" && {
            channelId: "vitacare-reminders",
            vibration: prefs.vibrationEnabled ? undefined : null,
          }),
        },
        trigger: {
          type: ExpoNotifications.SchedulableTriggerInputTypes.DATE,
          date: scheduledFor,
        },
      });
    } catch (error) {
      console.warn(
        "[NotificationService] scheduleNotificationAsync not available (Expo Go):",
        error,
      );
      return null;
    }

    await this.addToInbox({
      id: identifier,
      title,
      content: body,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      scheduledFor: scheduledFor.toISOString(),
    });

    return identifier;
  }

  async cancel(identifier: string): Promise<void> {
    try {
      await ExpoNotifications.cancelScheduledNotificationAsync(identifier);
    } catch {
      /* Expo Go */
    }
    await this.deleteFromInbox(identifier);
  }

  async cancelByDataKey(key: string, value: string): Promise<void> {
    const inbox = await this.getInboxData();
    const match = inbox.find((n) => {
      if (n.id && n.id.includes(value)) return true;
      return false;
    });
    if (match?.id) {
      await this.cancel(match.id);
    }
  }

  async cancelAll(resetPreferences: boolean = false): Promise<void> {
    try {
      await ExpoNotifications.cancelAllScheduledNotificationsAsync();
    } catch {
      /* Expo Go */
    }

    await AsyncStorage.removeItem(STORAGE_KEY_INBOX);
    await AsyncStorage.removeItem(STORAGE_KEY_INBOX_CACHE);

    if (resetPreferences) {
      await AsyncStorage.removeItem(STORAGE_KEY_PREFERENCES);
      useNotificationStore
        .getState()
        .updatePreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    }

    useNotificationStore.getState().setInbox([]);
    useNotificationStore.getState().setUnreadCount(0);

    await this.updateBadge();

    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }

  // ── Convenience schedulers ─────────────────────────────────────────────

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
  }): Promise<string | null> {
    const prefs = await this.getPreferences();
    const lead = leadTimeMinutes ?? prefs.reminderLeadTimeMinutes;
    const triggerDate = new Date(appointmentDate.getTime() - lead * 60_000);

    if (triggerDate <= new Date()) return null;

    return this.schedule({
      title: "Rappel de rendez-vous",
      body: `Votre rendez-vous avec ${doctorName} est dans ${lead} min.`,
      scheduledFor: triggerDate,
      type: "appointment_reminder",
      metadata: { appointmentId, doctorName },
    });
  }

  async scheduleTreatmentReminder({
    treatmentId,
    treatmentName,
    reminderTime,
  }: {
    treatmentId: string;
    treatmentName: string;
    reminderTime: Date;
  }): Promise<string | null> {
    return this.schedule({
      title: "Rappel de traitement",
      body: `N'oubliez pas de prendre votre traitement : ${treatmentName}.`,
      scheduledFor: reminderTime,
      type: "treatment_reminder",
      metadata: { treatmentId, treatmentName },
    });
  }

  // ── Event listeners ────────────────────────────────────────────────────

  addForegroundListener(
    callback?: (notification: ExpoNotifications.Notification) => void,
  ): ExpoNotifications.Subscription {
    try {
      return ExpoNotifications.addNotificationReceivedListener(
        async (notification) => {
          const { title, body, data } = notification.request.content;

          await this.addToInbox({
            id: notification.request.identifier,
            title: title ?? "",
            content: body ?? "",
            type: (data?.type as NotificationCategory) ?? "system",
            read: false,
            createdAt: new Date().toISOString(),
          });

          callback?.(notification);
        },
      );
    } catch {
      return { remove: () => {} };
    }
  }

  addResponseListener(
    callback: (response: ExpoNotifications.NotificationResponse) => void,
  ): ExpoNotifications.Subscription {
    try {
      return ExpoNotifications.addNotificationResponseReceivedListener(
        callback,
      );
    } catch {
      return { remove: () => {} };
    }
  }

  destroy(): void {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }
}

// ── Export singleton ──────────────────────────────────────────────────────

export const notificationService = NotificationService.getInstance();
