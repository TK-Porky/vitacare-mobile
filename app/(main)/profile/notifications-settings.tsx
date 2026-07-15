import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { colors, fontFamily, fontSize } from "@/themes";
import { TopBar } from "@/components";
import { notificationService } from "@/services/notifications.service";
import { useProfileStore } from "@/store/profile.store";
import { useAuthStore } from "@/store/auth.store";

type ToggleItemProps = {
  label: string;
  description: string;
  isEnabled: boolean;
  onToggle: (value: boolean) => void;
  isLoading?: boolean;
};

function ToggleItem({
  label,
  description,
  isEnabled,
  onToggle,
  isLoading,
}: ToggleItemProps) {
  return (
    <View style={styles.toggleItem}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Switch
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={isEnabled ? colors.primary : colors.white}
          ios_backgroundColor={colors.border}
          onValueChange={onToggle}
          value={isEnabled}
        />
      )}
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState(true);
  const [appointments, setAppointments] = useState(true);
  const [healthTips, setHealthTips] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const localPrefs = await notificationService.getPreferences();
        setReminders(localPrefs.treatmentReminders);
        setAppointments(localPrefs.appointmentReminders);
        setHealthTips(localPrefs.healthTips);

        await useProfileStore.getState().getProfile();
        const user = useAuthStore.getState().user as any;
        if (user?.preferences) {
        }
      } catch (err) {
        console.warn("[NotificationsSettings] Error loading preferences:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const handleToggle = (
    key: "treatmentReminders" | "appointmentReminders" | "healthTips",
  ) => {
    return async (value: boolean) => {
      if (key === "treatmentReminders") setReminders(value);
      if (key === "appointmentReminders") setAppointments(value);
      if (key === "healthTips") setHealthTips(value);

      setIsSaving(true);
      try {
        await notificationService.savePreferences({
          [key]: value,
        });

        const backendKey =
          key === "treatmentReminders"
            ? "medicationReminders"
            : key === "appointmentReminders"
              ? "appointmentReminders"
              : "promotions";

        await useProfileStore.getState().updatePreferences({
          [backendKey]: value,
        });
      } catch (err: any) {
        Alert.alert(
          t("common.error"),
          t("profile.notificationsScreen.saveError"),
        );
        if (key === "treatmentReminders") setReminders(!value);
        if (key === "appointmentReminders") setAppointments(!value);
        if (key === "healthTips") setHealthTips(!value);
      } finally {
        setIsSaving(false);
      }
    };
  };

  const handleTestNotification = async () => {
    try {
      const triggerDate = new Date(Date.now() + 3000);
      await notificationService.schedule({
        title: t("profile.notificationsScreen.testNotificationTitle"),
        body: t("profile.notificationsScreen.testNotificationBody"),
        scheduledFor: triggerDate,
        type: "system",
      });
      Alert.alert(
        t("profile.notificationsScreen.testScheduled"),
        t("profile.notificationsScreen.testScheduledMessage"),
      );
    } catch (err: any) {
      Alert.alert(
        t("common.error"),
        t("profile.notificationsScreen.testErrorMessage"),
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <TopBar title={t("profile.notificationsScreen.title")} />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <View style={styles.card}>
              <ToggleItem
                label={t("profile.notificationsScreen.medicationReminders")}
                description={t("profile.notificationsScreen.medicationRemindersDesc")}
                isEnabled={reminders}
                onToggle={handleToggle("treatmentReminders")}
              />
              <ToggleItem
                label={t("profile.notificationsScreen.appointmentAlerts")}
                description={t("profile.notificationsScreen.appointmentAlertsDesc")}
                isEnabled={appointments}
                onToggle={handleToggle("appointmentReminders")}
              />
              <ToggleItem
                label={t("profile.notificationsScreen.healthTips")}
                description={t("profile.notificationsScreen.healthTipsDesc")}
                isEnabled={healthTips}
                onToggle={handleToggle("healthTips")}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("profile.notificationsScreen.testSection")}</Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestNotification}
              activeOpacity={0.8}
            >
              <Text style={styles.testButtonText}>
                {t("profile.notificationsScreen.testButton")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={styles.infoText}>
              {t("profile.notificationsScreen.testInfo")}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    marginBottom: 16,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  toggleText: {
    flex: 1,
    gap: 4,
  },
  toggleLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  toggleDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  infoBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  testButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.white,
  },
});
