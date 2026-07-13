import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Share,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontFamily, fontSize } from "@/themes";
import { useReminders } from "@/hooks";
import { ReminderResponse } from "@/types/api-responses";
import {
  EditReminderBottomSheet,
  EditReminderBottomSheetRef,
} from "@/components/reminders/EditReminderBottomSheet";

type ReminderStatus = "PENDING" | "TAKEN" | "MISSED" | "SNOOZED";

const STATUS_CONFIG: Record<
  ReminderStatus,
  {
    color: string;
    bg: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  PENDING: {
    color: "#854F0B",
    bg: "#FAEEDA",
    icon: "time-outline",
  },
  TAKEN: {
    color: "#085041",
    bg: "#E1F5EE",
    icon: "checkmark-circle-outline",
  },
  MISSED: {
    color: "#791F1F",
    bg: "#FCEBEB",
    icon: "close-circle-outline",
  },
  SNOOZED: {
    color: "#0C447C",
    bg: "#E6F1FB",
    icon: "alarm-outline",
  },
};

export default function ReminderDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reminder, setReminder] = useState<ReminderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const editSheetRef = useRef<EditReminderBottomSheetRef>(null);

  const { getReminder, markAsTaken, snoozeReminder, deleteReminder } =
    useReminders();

  useEffect(() => {
    if (id) fetchReminder();
  }, [id]);

  const fetchReminder = async () => {
    try {
      setIsLoading(true);
      const data = await getReminder(id);
      setReminder(data);
    } catch {
      Alert.alert(t("common.error"), t("reminders.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsTaken = async () => {
    if (!reminder) return;
    try {
      setIsUpdating(true);
      await markAsTaken({ id: String(reminder.id) });
      await fetchReminder();
      if (Platform.OS === "ios")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(t("common.error"), t("reminders.markTakenError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSnooze = () => {
    Alert.alert(t("reminders.snoozeTitle"), t("reminders.snoozeTitle"), [
      { text: t("reminders.snooze15min"), onPress: () => performSnooze(15) },
      { text: t("reminders.snooze30min"), onPress: () => performSnooze(30) },
      { text: t("reminders.snooze1hour"), onPress: () => performSnooze(60) },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const performSnooze = async (minutes: number) => {
    if (!reminder) return;
    try {
      setIsUpdating(true);
      await snoozeReminder({ id: String(reminder.id), minutes });
      await fetchReminder();
      if (Platform.OS === "ios")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert(t("common.error"), t("reminders.addError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
      Alert.alert(
        t("reminders.delete"),
        t("reminders.confirmDelete"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await deleteReminder(String(reminder!.id));
                if (Platform.OS === "ios")
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Error,
                  );
                router.back();
              } catch {
                Alert.alert(t("common.error"), t("reminders.addError"));
              }
            },
          },
        ],
      );
  };

  const handleShare = async () => {
    if (!reminder) return;
    await Share.share({
      message: `💊 ${reminder.medicationName} — ${reminder.dosage || "dosage non spécifié"}\n${t("reminders.addForm.time")} : ${reminder.scheduledHour}\n${t("reminders.addForm.frequency")} : ${reminder.frequency}`,
      title: `${t("reminders.title")} — ${reminder.medicationName}`,
    });
  };

  const handleEdit = () => {
    if (reminder) editSheetRef.current?.open(reminder);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  if (!reminder) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{t("reminders.error")}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text
            style={{ color: colors.primary, fontFamily: fontFamily.semiBold }}
          >
            {t("common.back")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusCfg =
    STATUS_CONFIG[reminder.status as ReminderStatus] ?? STATUS_CONFIG.PENDING;
  const isActionable =
    reminder.status === "PENDING" || reminder.status === "SNOOZED";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={16} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("reminders.title")}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleEdit}>
            <Ionicons name="pencil-sharp" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="medical" size={24} color={colors.primary} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{reminder.medicationName}</Text>
            <Text style={styles.heroDosage}>
              {reminder.dosage || t("reminders.addForm.dosage")}
              {reminder.form ? ` · ${reminder.form}` : ""}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={12} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {t(`reminders.filters.${reminder.status}` as any)}
            </Text>
          </View>
        </View>

        {/* Informations */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={colors.inkLight} />
            <Text style={styles.detailLabel}>{t("reminders.addForm.time")}</Text>
            <Text style={styles.detailValue}>{reminder.scheduledHour}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.detailRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.inkLight}
            />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date(
                reminder.scheduledDate || Date.now(),
              ).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.detailRow}>
            <Ionicons name="repeat-outline" size={16} color={colors.inkLight} />
            <Text style={styles.detailLabel}>{t("reminders.addForm.frequency")}</Text>
            <Text style={styles.detailValue}>
              {reminder.frequency || "Non définie"}
            </Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.detailRow}>
            <Ionicons name="flask-outline" size={16} color={colors.inkLight} />
            <Text style={styles.detailLabel}>{t("reminders.addForm.dosage")}</Text>
            <Text style={styles.detailValue}>
              {reminder.dosage || "Non spécifié"}
            </Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color={colors.inkLight} />
            <Text style={styles.detailLabel}>{t("reminders.addForm.form")}</Text>
            <Text style={styles.detailValue}>
              {reminder.form || "Non spécifiée"}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {reminder.notes && (
          <View style={styles.detailCard}>
            <Text style={styles.notesLabel}>{t("reminders.addForm.notes")}</Text>
            <Text style={styles.notesText}>{reminder.notes}</Text>
          </View>
        )}

        {/* Actions de report */}
        {isActionable && (
          <>
            <Text style={styles.sectionLabel}>{t("reminders.snooze")}</Text>
            <View style={styles.snoozeRow}>
              {[15, 30, 60].map((min) => (
                <TouchableOpacity
                  key={min}
                  style={styles.snoozeChip}
                  onPress={() => performSnooze(min)}
                >
                  <Text style={styles.snoozeChipText}>
                    {min < 60 ? `${min} min` : t("reminders.snooze1hour")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Actions principales */}
        <View style={styles.actions}>
          {isActionable && (
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleMarkAsTaken}
              disabled={isUpdating}
            >
              <Ionicons name="checkmark" size={17} color="#fff" />
              <Text style={styles.btnPrimaryText}>{t("reminders.markAsTaken")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.btnDanger} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles.btnDangerText}>{t("reminders.delete")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EditReminderBottomSheet ref={editSheetRef} onClose={fetchReminder} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
  },
  loadingText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },
  errorText: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semiBold,
    color: colors.error,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },

  content: { padding: 14, gap: 10 },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 16,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroInfo: { flex: 1, minWidth: 0 },
  heroName: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.ink,
    marginBottom: 2,
  },
  heroDosage: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusText: { fontSize: 11, fontFamily: fontFamily.semiBold },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.inkLight,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 2,
  },

  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    overflow: "hidden",
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    width: 70,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  rowDivider: { height: 0.5, backgroundColor: colors.border, marginLeft: 42 },

  notesLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.inkLight,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  notesText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    paddingHorizontal: 14,
    paddingBottom: 14,
    lineHeight: 20,
  },

  snoozeRow: { flexDirection: "row", gap: 8 },
  snoozeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  snoozeChipText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.inkLight,
  },

  actions: { gap: 8, marginTop: 4 },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.white,
  },
  btnDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderRadius: 60,
    borderColor: colors.border,
    padding: 12,
  },
  btnDangerText: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semiBold,
    color: colors.error,
  },
});
