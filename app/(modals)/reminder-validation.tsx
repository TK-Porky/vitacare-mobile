import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, fontFamily, fontSize } from "@/themes";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { GrayButton } from "@/components/buttons/GrayButton";
import { useReminders } from "@/hooks";

export default function ReminderValidationModal() {
  const params = useLocalSearchParams();
  const {
    reminderId,
    medicationName,
    dosage,
    scheduledTime,
    form = "Gélule",
  } = params;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    "take" | "snooze" | "skip" | null
  >(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { markAsTaken, snoozeReminder, deleteReminder } = useReminders();

  // Effet de vibration au démarrage
  useEffect(() => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate(200);
    }
  }, []);

  // Timer pour snooze (15 min)
  useEffect(() => {
    if (selectedAction === "snooze") {
      setTimeLeft(15 * 60); // 15 minutes en secondes
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedAction]);

  const handleTake = useCallback(async () => {
    setSelectedAction("take");
    setIsLoading(true);

    try {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // ✅ Marquer comme pris
      await markAsTaken({ id: reminderId as string });

      // Afficher un message de succès
      Alert.alert(
        "✅ Prise confirmée",
        `${medicationName} a été marqué comme pris.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible de marquer le rappel comme pris.");
    } finally {
      setIsLoading(false);
    }
  }, [reminderId, medicationName, markAsTaken]);

  const handleSnooze = useCallback(async () => {
    setSelectedAction("snooze");
    setIsLoading(true);

    try {
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // ⏰ Reporter le rappel
      await snoozeReminder({ id: reminderId as string, minutes: 15 });

      Alert.alert("⏰ Rappel reporté", `Vous serez notifié dans 15 minutes.`, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de reporter le rappel.");
    } finally {
      setIsLoading(false);
    }
  }, [reminderId, snoozeReminder]);

  const handleSkip = useCallback(async () => {
    setSelectedAction("skip");
    setIsLoading(true);

    try {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // ❌ Supprimer le rappel
      await deleteReminder(reminderId as string);

      Alert.alert(
        "❌ Rappel ignoré",
        `Le rappel pour ${medicationName} a été ignoré.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ignorer le rappel.");
    } finally {
      setIsLoading(false);
    }
  }, [reminderId, medicationName, deleteReminder]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* ── Animation / Icon ── */}
        <View style={styles.iconContainer}>
          <View style={styles.pulseRing} />
          <View style={styles.iconCircle}>
            <Ionicons name="medical" size={48} color={colors.white} />
          </View>
        </View>

        {/* ── Informations ── */}
        <Text style={styles.title}>Rappel de médicament</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="medkit" size={20} color={colors.primary} />
            <Text style={styles.infoLabel}>Médicament:</Text>
            <Text style={styles.infoValue}>{medicationName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="scale-outline" size={20} color={colors.primary} />
            <Text style={styles.infoLabel}>Dosage:</Text>
            <Text style={styles.infoValue}>{dosage}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.infoLabel}>Heure prévue:</Text>
            <Text style={styles.infoValue}>{scheduledTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={20} color={colors.primary} />
            <Text style={styles.infoLabel}>Forme:</Text>
            <Text style={styles.infoValue}>{form}</Text>
          </View>
        </View>

        {/* ── Timer de snooze ── */}
        {selectedAction === "snooze" && timeLeft !== null && timeLeft > 0 && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Report dans:</Text>
            <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <PrimaryButton
            label="Pris"
            onPress={handleTake}
            isLoading={isLoading && selectedAction === "take"}
            isDisabled={isLoading}
            size="lg"
            fullWidth
          />

          <View style={styles.secondaryActions}>
            <GrayButton
              label="Reporter 15min"
              onPress={handleSnooze}
              disabled={isLoading}
              style={styles.secondaryButton}
            />
            <GrayButton
              label="Ignorer"
              onPress={handleSkip}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* ── Footer ── */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.closeText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
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
  actions: {
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
  closeButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  closeText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
});
