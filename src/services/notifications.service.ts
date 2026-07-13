import * as ExpoNotifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
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
const STORAGE_KEY_FCM_TOKEN = "vitacare:notifications:fcmToken";
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
  pageSize?: number;
  hasNextPage: boolean;
  total: number;
}

interface DeviceInfo {
  brand: string | null;
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceType: string | null;
  isDevice: boolean;
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

  // Enregistre le token de notification
  async register(): Promise<string | null> {
    if (this._isRegistered) {
      return this._pushToken;
    }

    try {
      // S'assurer que le handler est défini
      ExpoNotifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Vérifier les permissions
      const { status: existingStatus } =
        await ExpoNotifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await ExpoNotifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("[NotificationService] Permission not granted.");
        return null;
      }

      // ✅ Créer les canaux Android
      if (Platform.OS === "android") {
        await this.createAndroidChannels();
      }

      // ✅ Obtenir le token
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      const tokenData = await ExpoNotifications.getExpoPushTokenAsync({
        projectId,
      });

      this._pushToken = tokenData.data;
      await AsyncStorage.setItem(STORAGE_KEY_PUSH_TOKEN, this._pushToken);
      this._isRegistered = true;

      // ✅ Configurer les catégories iOS
      await this.setupNotificationCategories();

      // ✅ Démarrer le nettoyage
      this.startCleanupJob();

      return this._pushToken;
    } catch (error) {
      console.error("[NotificationService] Registration error:", error);
      return null;
    }
  }

  // Méthode helper pour les canaux Android
  private async createAndroidChannels(): Promise<void> {
    try {
      await ExpoNotifications.setNotificationChannelAsync("vitacare-default", {
        name: "VitaCare",
        importance: ExpoNotifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0D9488",
      });
      await ExpoNotifications.setNotificationChannelAsync(
        "vitacare-reminders",
        {
          name: "Rappels",
          importance: ExpoNotifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#0D9488",
        },
      );
      if (__DEV__) console.log("✅ Canaux Android créés");
    } catch (error) {
      console.warn("⚠️ Could not create notification channels:", error);
    }
  }

  // ─── Gestion du token FCM ──────────────────────────────────────────────

  // Permission
  async getFCMToken(): Promise<string | null> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        if (__DEV__) console.log("Permission de notification refusée");
        return null;
      }

      // Sur Android, cela fonctionne directement. Sur iOS, il faut parfois le token APNS d'abord.
      const fcmToken = await messaging().getToken();
      return fcmToken;
    } catch (error) {
      console.error("Erreur getFCMToken:", error);
      return null;
    }
  }

  // Supprimer le token FCM
  async deleteFCMToken() {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem(STORAGE_KEY_FCM_TOKEN);
      if (__DEV__) console.log("✅ Token FCM supprimé");
    } catch (error) {
      console.error("Erreur deleteFCMToken:", error);
    }
  }

  // Enregistrer le token FCM auprès du backend
  private async saveTokenToBackend(
    deviceInfo: DeviceInfo,
    token: string,
  ): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(`/fcm/token`, {
        fcmToken: token,
        deviceInfo: {
          brand: deviceInfo.brand,
          model: deviceInfo.modelName,
          os: deviceInfo.osName,
          osVersion: deviceInfo.osVersion,
          type: deviceInfo.deviceType,
          isDevice: deviceInfo.isDevice,
        },
      });
      return response;
    } catch (error) {
      console.error("❌ Erreur de sauvegarde du token:", error);
      throw error;
    }
  }

  // Enregistrer le device auprès du backend
  async registerDevice(
    deviceToken: string | null,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    if (!deviceToken) {
      console.warn("🚨 Token manquant, impossible d'enregistrer le device");
      return;
    }

    try {
      const response = await this.saveTokenToBackend(deviceInfo, deviceToken);

      if (!response.success) {
        throw new Error(response.error || "Erreur lors de l'enregistrement");
      }

      // ✅ Sauvegarder le token localement
      await AsyncStorage.setItem(STORAGE_KEY_FCM_TOKEN, deviceToken);
      if (__DEV__) console.log("✅ Device enregistré avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du device:", error);
    }
  }

  // Supprimer l'enregistrement du device
  async clearDeviceRegistration(): Promise<void> {
    if (!this._pushToken) {
      console.warn("🚨 Token manquant, impossible de désenregistrer le device");
      return;
    }

    try {
      // Supprimer le token FCM
      await this.deleteFCMToken();

      // Supprimer le push token Expo
      this._pushToken = null;
      await AsyncStorage.removeItem(STORAGE_KEY_PUSH_TOKEN);

      // Désenregistrer du backend
      await apiClient.delete(`/fcm/token/${this._pushToken}`);

      if (__DEV__) console.log("✅ Device désenregistré");
    } catch (error) {
      console.error("❌ Erreur de désenregistrement:", error);
    }
  }

  // ── Gestion des notifications de rappel ──────────────────────────────

  // Gérer l'ouverture d'une notification de rappel
  handleReminderNotification(data: ReminderNotificationData): void {
    if (__DEV__) console.log("🔔 Notification de rappel ouverte:", data);

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

  // Planifier une notification de rappel
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
          // categoryIdentifier uniquement sur iOS
          ...(Platform.OS === "ios" && {
            categoryIdentifier: "reminder",
          }),
        },
        trigger: {
          type: ExpoNotifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      if (__DEV__) console.log(`✅ Notification programmée: ${identifier}`);
      return identifier;
    } catch (error) {
      console.error("❌ Erreur de programmation:", error);
      return null;
    }
  }

  // Configurer les catégories de notifications (iOS)
  async setupNotificationCategories(): Promise<void> {
    if (Platform.OS === "ios") {
      try {
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
        if (__DEV__) console.log("✅ Catégories de notification configurées");
      } catch (error) {
        console.error("❌ Erreur de configuration des catégories:", error);
      }
    }
  }

  // Gérer les actions de notification
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

    if (__DEV__) console.log(`📱 Action de notification: ${actionIdentifier}`, reminderData);

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

  // Gérer l'action "prise"
  private async handleTakeAction(
    data: ReminderNotificationData,
  ): Promise<void> {
    if (__DEV__) console.log("✅ Prise confirmée:", data.reminderId);

    try {
      const response = await apiClient.patch<ApiResponse>(
        `/reminders/mark-taken`,
        {
          reminderId: data.reminderId,
          takenAt: new Date().toISOString(),
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Erreur lors du marquage");
      }

      Alert.alert(
        "✅ Prise confirmée",
        `${data.medicationName} a été marqué comme pris.`,
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("❌ Erreur:", error);
      Alert.alert("Erreur", "Impossible de marquer le rappel comme pris.");
    } finally {
      // TOUJOURS annuler la notification, même en cas d'erreur
      await this.cancel(data.reminderId);
    }
  }

  // Gérer l'action "snooze"
  private async handleSnoozeAction(
    data: ReminderNotificationData,
  ): Promise<void> {
    if (__DEV__) console.log("⏰ Snooze:", data.reminderId);

    try {
      const response = await apiClient.patch<ApiResponse>(`/reminders/snooze`, {
        reminderId: data.reminderId,
        minutes: data.minutes,
      });

      if (!response.success) {
        throw new Error(response.message || "Erreur lors du report");
      }

      const newTime = new Date(Date.now() + 15 * 60 * 1000);

      await this.scheduleTreatmentReminder({
        treatmentId: data.reminderId,
        treatmentName: data.medicationName,
        reminderTime: newTime,
      });

      Alert.alert(
        "⏰ Rappel reporté",
        `Vous serez notifié dans ${data.minutes} minutes.`,
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("❌ Erreur de snooze:", error);
      Alert.alert("Erreur", "Impossible de reporter le rappel.");
    } finally {
      // ✅ TOUJOURS annuler l'ancienne notification
      await this.cancel(data.reminderId);
    }
  }

  // Gérer l'action "ignoré"
  private async handleSkipAction(
    data: ReminderNotificationData,
  ): Promise<void> {
    if (__DEV__) console.log("❌ Ignoré:", data.reminderId);

    try {
      const response = await apiClient.patch<ApiResponse>(`/reminders/skip`, {
        reminderId: data.reminderId,
      });

      if (!response.success) {
        throw new Error(response.message || "Erreur lors de l'ignorance");
      }

      Alert.alert(
        "❌ Rappel ignoré",
        `Le rappel pour ${data.medicationName} a été ignoré.`,
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("❌ Erreur:", error);
      Alert.alert("Erreur", "Impossible d'ignorer le rappel.");
    } finally {
      // TOUJOURS annuler la notification
      await this.cancel(data.reminderId);
    }
  }

  // ── Getters ─────────────────────────────────────────────────────────────

  // Getter pour le push token
  get pushToken(): string | null {
    return this._pushToken;
  }

  // Charger le push token sauvegardé
  async loadSavedToken(): Promise<string | null> {
    this._pushToken = await AsyncStorage.getItem(STORAGE_KEY_PUSH_TOKEN);
    return this._pushToken;
  }

  // ── Preferences ────────────────────────────────────────────────────────

  // Récupérer les préférences de notification
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

  // Sauvegarder les préférences de notification
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

  // Récupérer la boîte de réception
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
        if (__DEV__) console.log(response);
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
        if (__DEV__) console.log("[NotificationService] Using cached inbox data");
        return cached;
      }

      throw error;
    }
  }

  // Ajouter une notification à la boîte de réception
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

  // Marquer une notification comme lue
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

  // Marquer toutes les notifications comme lues
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

  // Supprimer une notification de la boîte de réception
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

  // Supprimer toutes les notifications
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

  // Récupérer le nombre de notifications non lues
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

  private async saveFCMToken(): Promise<string | null> {
    const token = await this.getFCMToken();
    if (!token) {
      console.warn("🚨 Token manquant, impossible d'enregistrer le device");
      return null;
    }
    await AsyncStorage.setItem(STORAGE_KEY_FCM_TOKEN, token);
    return token;
  }

  // Récupérer la boîte de réception depuis le cache
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

  // Mettre en cache la boîte de réception
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
        STORAGE_KEY_INBOX_CACHE,
        JSON.stringify(cacheData),
      );
    } catch (error) {
      console.warn("[NotificationService] Failed to cache inbox:", error);
    }
  }

  // Récupérer la boîte de réception depuis le cache
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
          pageSize: cached.pageSize || PAGE_SIZE,
          totalPages: Math.ceil(cached.total / (cached.pageSize || PAGE_SIZE)),
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

  // Mettre à jour le badge
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

  // Démarrer le nettoyage
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

  // Nettoyage des notifications expirées
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

  // Planifier une notification locale
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

  // Annuler une notification locale
  async cancel(identifier: string): Promise<void> {
    try {
      await ExpoNotifications.cancelScheduledNotificationAsync(identifier);
    } catch {
      /* Expo Go */
    }
    await this.deleteFromInbox(identifier);
  }

  // Annuler une notification locale par clé de données
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

  // Annuler toutes les notifications locales
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

  // Planifier un rappel de rendez-vous
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

  // Planifier un rappel de traitement
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

  // Ajoute un listener pour les notifications reçues en premier plan
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

  // Ajoute un listener pour les réponses aux notifications
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

  // Détruit le service
  destroy(): void {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }
}

// ── Export singleton ──────────────────────────────────────────────────────

export const notificationService = NotificationService.getInstance();
