import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Vibration,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontFamily, fontSize } from "@/themes";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { GrayButton } from "@/components/buttons/GrayButton";
import { useReminders } from "@/hooks";
import { ReminderResponse } from "@/types/api-responses";

// ================================================================================== //
// Main
// ================================================================================== //

export default function ReminderValidateScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { reminderId, medicationName, dosage, scheduledTime } = params;

  const [reminder, setReminder] = useState<ReminderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    "take" | "snooze" | "skip" | null
  >(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { getReminder, markAsTaken, snoozeReminder, skipReminder } =
    useReminders();

  // ================================================================================== //
  // Effects
  // ================================================================================== //

  useEffect(() => {
    if (reminderId) {
      fetchReminder();
    }
  }, [reminderId]);

  // ✅ Vibration au démarrage
  useEffect(() => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate(200);
    }
  }, []);

  // ✅ Timer pour snooze
  useEffect(() => {
    if (selectedAction === "snooze") {
      setTimeLeft(15 * 60);
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedAction]);

  // ================================================================================== //
  // Functions
  // ================================================================================== //

  const fetchReminder = async () => {
    try {
      setIsLoading(true);
      const data = await getReminder(reminderId as string);
      setReminder(data);
    } catch (error) {
      console.error("Error fetching reminder:", error);
      // ✅ Utiliser les données des params avec un cast sécurisé
      // Ne pas créer d'objet ReminderResponse complet, juste garder les infos nécessaires
      setReminder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTake = async () => {
    setSelectedAction("take");
    setIsUpdating(true);

    try {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await markAsTaken({ id: reminderId as string });

      Alert.alert(
        t("reminders.taken"),
        `${reminder?.medicationName || medicationName || t("medications.available")} ${t("reminders.markAsTaken")}.`,
        [{ text: t("common.ok"), onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert(t("common.error"), t("reminders.markTakenError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSnooze = async () => {
    setSelectedAction("snooze");
    setIsUpdating(true);

    try {
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      await snoozeReminder({ id: reminderId as string, minutes: 15 });

      Alert.alert(t("reminders.snoozed"), t("reminders.snoozeTitle"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(t("common.error"), t("reminders.addError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSkip = async () => {
    setSelectedAction("skip");
    setIsUpdating(true);

    try {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      await skipReminder(reminderId as string);

      Alert.alert(
        t("reminders.skip"),
        `${t("reminders.skip")}: ${reminder?.medicationName || medicationName || t("medications.available")}`,
        [{ text: t("common.ok"), onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert(t("common.error"), t("reminders.addError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  // ================================================================================== //
  // Render
  // ================================================================================== //

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  const displayName =
    reminder?.medicationName ||
    reminder?.name ||
    (medicationName as string) ||
    t("medications.available");

  const displayDosage =
    reminder?.dosage || reminder?.medicationDosage || (dosage as string) || "";

  const displayTime =
    reminder?.scheduledHour ||
    reminder?.time ||
    (scheduledTime
      ? new Date(scheduledTime as string).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "");

  const displayForm = reminder?.form || t("reminders.addForm.form");
  const displayFrequency = reminder?.frequency || t("reminders.addForm.frequency");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="rgba(0,0,0,0.5)" />

      <View style={styles.content}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.inkLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("reminders.title")}</Text>
          <View style={styles.closeButton} />
        </View>

        {/* ── Icon ── */}
        <View style={styles.iconContainer}>
          <View style={styles.pulseRing} />
          <View style={styles.iconCircle}>
            <Ionicons name="medical" size={48} color={colors.white} />
          </View>
        </View>

        {/* ── Medication Info ── */}
        <Text style={styles.title}>{t("reminders.title")}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="medkit-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>{t("medications.available")}:</Text>
            <Text style={styles.infoValue}>{displayName}</Text>
          </View>
          {displayDosage && (
            <View style={styles.infoRow}>
              <Ionicons name="scale-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>{t("reminders.addForm.dosage")}:</Text>
              <Text style={styles.infoValue}>{displayDosage}</Text>
            </View>
          )}
          {displayTime && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>{t("reminders.addForm.time")}:</Text>
              <Text style={styles.infoValue}>{displayTime}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>{t("reminders.addForm.form")}:</Text>
            <Text style={styles.infoValue}>{displayForm}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="repeat-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>{t("reminders.addForm.frequency")}:</Text>
            <Text style={styles.infoValue}>{displayFrequency}</Text>
          </View>
        </View>

        {/* ── Timer de snooze ── */}
        {selectedAction === "snooze" && timeLeft !== null && timeLeft > 0 && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{t("reminders.snooze")}:</Text>
            <Text style={styles.timerValue}>
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
              {String(timeLeft % 60).padStart(2, "0")}
            </Text>
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            label={t("reminders.taken")}
            onPress={handleTake}
            isLoading={isUpdating && selectedAction === "take"}
            isDisabled={isUpdating}
            size="lg"
            fullWidth
          />

          <View style={styles.secondaryActions}>
            <GrayButton
              label={t("reminders.snooze") + " 15min"}
              onPress={handleSnooze}
              disabled={isUpdating}
              style={styles.secondaryButton}
            />
            <GrayButton
              label={t("reminders.skip")}
              onPress={handleSkip}
              disabled={isUpdating}
            />
          </View>
        </View>

        {/* ── Footer ── */}
        <TouchableOpacity style={styles.footerButton} onPress={handleClose}>
          <Text style={styles.footerText}>{t("common.close")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginTop: 12,
  },
  content: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    marginHorizontal: 8,
    borderRadius: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  pulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: 0.3,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
    textAlign: "center",
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  infoLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    width: 90,
  },
  infoValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.ink,
    flex: 1,
  },
  timerContainer: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: colors.primary + "10",
    borderRadius: 12,
  },
  timerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  timerValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.primary,
  },
  actionsContainer: {
    gap: 12,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
  },
  skipButton: {
    borderColor: colors.error,
  },
  footerButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
});
