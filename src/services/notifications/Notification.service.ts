import i18next from "@/i18n";
import * as ExpoNotifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import { router } from "expo-router";
import { Platform, Alert } from "react-native";
import {
  NotificationCategory,
  NotificationMetadata,
  ReminderNotificationData,
  ApiResponse,
} from "@/types";
import { apiClient } from "@/lib";
import { STORAGE_KEYS, DeviceInfo } from "./types";
import { inAppNotificationService } from "./InAppNotification.service";

/**
 * Service de gestion des notifications push (FCM + Expo)
 * Responsable de l'enregistrement, des permissions et des notifications push
 */
export class NotificationService {
  private static instance: NotificationService;
  private _pushToken: string | null = null;
  private _isRegistered = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ─── Permissions & registration ─────────────────────────────────────────

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
      await this.createAndroidChannels();
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    try {
      const tokenData = await ExpoNotifications.getExpoPushTokenAsync({
        projectId,
      });
      this._pushToken = tokenData.data;
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, this._pushToken);
      this._isRegistered = true;

      await this.setupNotificationCategories();

      // Démarrer le nettoyage des notifications expirées
      inAppNotificationService.startCleanupJob();

      return this._pushToken;
    } catch {
      console.warn(
        "[NotificationService] Could not obtain push token (requires a development build).",
      );
      return null;
    }
  }

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
          name: i18next.t('notifications.channelReminders'),
          importance: ExpoNotifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#0D9488",
        },
      );
      if (__DEV__) console.log("✅ Canaux Android créés");
    } catch (error) {
      console.warn(
        "[NotificationService] Could not create notification channels:",
        error,
      );
    }
  }

  // ─── FCM Token ──────────────────────────────────────────────────────────

  async getFCMToken(): Promise<string | null> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        if (__DEV__) console.log(i18next.t('notifications.permissionDenied'));
        return null;
      }

      const tokenStorage = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
      if (tokenStorage) {
        if (__DEV__) console.log("FCM Token déjà enregistré", tokenStorage);
        return tokenStorage;
      }

      const fcmToken = await messaging().getToken();
      if (__DEV__) console.log("FCM Token obtenu", fcmToken);
      return fcmToken;
    } catch (error) {
      console.error("Erreur getFCMToken:", error);
      return null;
    }
  }

  async deleteFCMToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem(STORAGE_KEYS.FCM_TOKEN);
      if (__DEV__) console.log("✅ Token FCM supprimé");
    } catch (error) {
      console.error("Erreur deleteFCMToken:", error);
    }
  }

  async registerDevice(
    deviceToken: string | null,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    if (!deviceToken) {
      console.warn("🚨 Token manquant, impossible d'enregistrer le device");
      return;
    }

    try {
      const deviceTokenStorage = await AsyncStorage.getItem(
        STORAGE_KEYS.FCM_TOKEN,
      );

      if (deviceTokenStorage === deviceToken) {
        if (__DEV__) console.log("✅ Device déjà enregistré");
        return;
      }

      const response = await apiClient.post<ApiResponse>(`/fcm/token`, {
        token: deviceToken,
        deviceInfo: deviceInfo.osName + " " + deviceInfo.osVersion,
      });

      if (!response.success) {
        throw new Error(response.error || "Erreur lors de l'enregistrement");
      }

      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, deviceToken);
      if (__DEV__) console.log("✅ Device enregistré avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du device:", error);
    }
  }

  // ─── Catégories de notifications (iOS) ──────────────────────────────────

  async setupNotificationCategories(): Promise<void> {
    if (Platform.OS === "ios") {
      try {
        await ExpoNotifications.setNotificationCategoryAsync("reminder", [
          {
            identifier: "take",
            buttonTitle: i18next.t('notifications.takeButton'),
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: "snooze",
            buttonTitle: i18next.t('notifications.snoozeButton'),
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: "skip",
            buttonTitle: i18next.t('notifications.skipButton'),
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

  // ─── Gestion des actions de notification ──────────────────────────────

  async handleNotificationAction(
    response: ExpoNotifications.NotificationResponse,
  ): Promise<void> {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data as Record<string, unknown>;

    const treatmentId = data.treatmentId as string;
    const treatmentName = data.treatmentName as string;

    // Fallback (Compatibilité)
    const reminderId = (data.reminderId as string) || treatmentId;
    const medicationName = (data.medicationName as string) || treatmentName;
    const dosage = (data.dosage as string) || "";
    const scheduledTime =
      (data.scheduledTime as string) || new Date().toISOString();

    if (reminderId) {
      const reminderData: ReminderNotificationData = {
        reminderId,
        medicationName: medicationName || i18next.t('medication'),
        dosage: dosage || "",
        scheduledTime: scheduledTime || new Date().toISOString(),
        action: (actionIdentifier as "take" | "snooze" | "skip") || undefined,
      };

      if (__DEV__) console.log("🔔 Données du rappel:", reminderData);

      // ✅ Actions spécifiques
      if (actionIdentifier === "take") {
        await this.handleTakeAction(reminderData);
        return;
      } else if (actionIdentifier === "snooze") {
        await this.handleSnoozeAction(reminderData);
        return;
      } else if (actionIdentifier === "skip") {
        await this.handleSkipAction(reminderData);
        return;
      }

      // ✅ Simple tap - ouvrir le modal de validation
      console.log(
        "🔔 Ouverture du modal de validation pour le rappel:",
        reminderId,
      );
      this.handleReminderNotification(reminderData);
      return;
    }
  }

  private async handleTakeAction(
    data: ReminderNotificationData,
  ): Promise<void> {
    if (__DEV__) console.log("✅ Prise confirmée:", data.reminderId);

    try {
      await apiClient.patch<ApiResponse>(`/reminders/${data.reminderId}/take`, {
        takenAt: new Date().toISOString(),
      });

      Alert.alert(
        i18next.t('notifications.takenTitle'),
        i18next.t('notifications.takenBody', { medicationName: data.medicationName }),
        [{ text: i18next.t('common.ok') }],
      );
    } catch (error) {
      console.error("❌ Erreur:", error);
      Alert.alert(i18next.t('common.error'), i18next.t('notifications.markTakenError'));
    } finally {
      await this.cancelNotification(data.reminderId);
    }
  }

  private async handleSnoozeAction(
    data: ReminderNotificationData,
  ): Promise<void> {
    if (__DEV__) console.log("⏰ Snooze:", data.reminderId);

    try {
      await apiClient.patch<ApiResponse>(
        `/reminders/${data.reminderId}/snooze`,
        {
          minutes: 15,
        },
      );

      const newTime = new Date(Date.now() + 15 * 60 * 1000);
      await this.scheduleTreatmentReminder({
        treatmentId: data.reminderId,
        treatmentName: data.medicationName,
        reminderTime: newTime,
      });

      Alert.alert(
        i18next.t('notifications.snoozedTitle'),
        i18next.t('notifications.snoozedBody', { minutes: 15 }),
        [{ text: i18next.t('common.ok') }],
      );
    } catch (error) {
      console.error("❌ Erreur de snooze:", error);
      Alert.alert(i18next.t('common.error'), i18next.t('notifications.snoozeError'));
    } finally {
      await this.cancelNotification(data.reminderId);
    }
  }

  private async handleSkipAction(
    data: ReminderNotificationData,
  ): Promise<void> {
    if (__DEV__) console.log("❌ Ignoré:", data.reminderId);

    try {
      await apiClient.patch<ApiResponse>(`/reminders/${data.reminderId}/skip`);

      Alert.alert(
        i18next.t('notifications.skippedTitle'),
        i18next.t('notifications.skippedBody', { medicationName: data.medicationName }),
        [{ text: i18next.t('common.ok') }],
      );
    } catch (error) {
      console.error("❌ Erreur:", error);
      Alert.alert(i18next.t('common.error'), i18next.t('notifications.skipError'));
    } finally {
      await this.cancelNotification(data.reminderId);
    }
  }

  // ─── Gestion des notifications de rappel ──────────────────────────────

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
        medicationName: data.medicationName || i18next.t('medication'),
        dosage: data.dosage || "",
        scheduledTime: data.scheduledTime || new Date().toISOString(),
        fromNotification: "true",
      },
    });
  }

  // ─── Planification de notifications ────────────────────────────────────

  async scheduleTreatmentReminder({
    treatmentId,
    treatmentName,
    reminderTime,
  }: {
    treatmentId: string;
    treatmentName: string;
    reminderTime: Date;
  }): Promise<string | null> {
    const prefs = await inAppNotificationService.getPreferences();

    if (!prefs.treatmentReminders) {
      if (__DEV__) console.log("⚠️ Rappels de traitement désactivés");
      return null;
    }

    if (reminderTime <= new Date()) {
      console.warn("⏰ Date de rappel déjà passée");
      return null;
    }

    return this.scheduleLocalNotification({
      title: i18next.t('notifications.treatmentReminderTitle'),
      subtitle: i18next.t('notifications.treatmentReminderSubtitle'),
      body: i18next.t('notifications.treatmentReminderBody', { treatmentName }),
      scheduledFor: reminderTime,
      type: "treatment_reminder",
      metadata: { treatmentId, treatmentName },
    });
  }

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
    const prefs = await inAppNotificationService.getPreferences();

    if (!prefs.appointmentReminders) {
      if (__DEV__) console.log("⚠️ Rappels de rendez-vous désactivés");
      return null;
    }

    const lead = leadTimeMinutes ?? prefs.reminderLeadTimeMinutes;
    const triggerDate = new Date(appointmentDate.getTime() - lead * 60_000);

    if (triggerDate <= new Date()) {
      console.warn("⏰ Date de rappel déjà passée");
      return null;
    }

    return this.scheduleLocalNotification({
      title: i18next.t('notifications.appointmentReminderTitle'),
      body: i18next.t('notifications.appointmentReminderBody', { doctorName, lead }),
      scheduledFor: triggerDate,
      type: "appointment_reminder",
      metadata: { appointmentId, doctorName },
    });
  }

  private async scheduleLocalNotification({
    title,
    body,
    subtitle,
    scheduledFor,
    type,
    metadata = {},
  }: {
    title: string;
    body: string;
    subtitle?: string;
    scheduledFor: Date;
    type: NotificationCategory;
    metadata?: NotificationMetadata;
  }): Promise<string | null> {
    const prefs = await inAppNotificationService.getPreferences();

    if (type === "appointment_reminder" && !prefs.appointmentReminders)
      return null;
    if (type === "treatment_reminder" && !prefs.treatmentReminders) return null;
    if (type === "health_tip" && !prefs.healthTips) return null;

    if (scheduledFor <= new Date()) {
      console.warn("⏰ Date de notification déjà passée");
      return null;
    }

    let identifier: string;
    try {
      identifier = await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title,
          subtitle,
          body,
          data: { type, ...metadata },
          sound: prefs.soundEnabled,
          ...(Platform.OS === "android" && {
            channelId: "vitacare-reminders",
            vibration: prefs.vibrationEnabled ? undefined : null,
          }),
          ...(Platform.OS === "ios" && {
            categoryIdentifier: "reminder",
          }),
        },
        trigger: {
          type: ExpoNotifications.SchedulableTriggerInputTypes.DATE,
          date: scheduledFor,
        },
      });
    } catch (error) {
      console.error(
        "[NotificationService] scheduleNotificationAsync error:",
        error,
      );
      return null;
    }

    // ✅ Ajouter à l'inbox locale
    await inAppNotificationService.addToInbox({
      id: identifier,
      title,
      content: body,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      scheduledFor: scheduledFor.toISOString(),
    });

    if (__DEV__) console.log(`✅ Notification planifiée: ${identifier}`);
    return identifier;
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await ExpoNotifications.cancelScheduledNotificationAsync(identifier);
    } catch {
      /* Expo Go */
    }
    await inAppNotificationService.deleteFromInbox(identifier);
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await ExpoNotifications.cancelAllScheduledNotificationsAsync();
    } catch {
      /* Expo Go */
    }
  }

  // ─── Getters ─────────────────────────────────────────────────────────────

  get pushToken(): string | null {
    return this._pushToken;
  }

  async loadSavedToken(): Promise<string | null> {
    this._pushToken = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
    return this._pushToken;
  }

  // ─── Event listeners ────────────────────────────────────────────────────

  addForegroundListener(
    callback?: (notification: ExpoNotifications.Notification) => void,
  ): ExpoNotifications.Subscription {
    try {
      return ExpoNotifications.addNotificationReceivedListener(
        async (notification) => {
          const { title, body, data } = notification.request.content;

          await inAppNotificationService.addToInbox({
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

  // ─── Destroy ────────────────────────────────────────────────────────────

  destroy(): void {
    inAppNotificationService.destroy();
  }
}

export const notificationService = NotificationService.getInstance();
