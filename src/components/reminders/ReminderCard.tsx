import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Pill } from "lucide-react-native";
import { colors, fontFamily, fontSize } from "@/themes";
import { Reminder } from "@/constants/reminders";

type ReminderCardProps = {
  item: Reminder;
  onView?: (id: string) => void;
  onMarkAsTaken?: (id: string) => void;
  onSnooze?: (id: string, minutes: number) => void;
  onDelete?: (id: string) => void;
  isMarkingAsTaken?: boolean;
  isSnoozing?: boolean;
  isDeleting?: boolean;
};

export const ReminderCard = React.memo(({
  item,
  onView,
  onMarkAsTaken,
  onSnooze,
  onDelete,
  isMarkingAsTaken,
  isSnoozing,
  isDeleting,
}: ReminderCardProps) => {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "#f39c12";
      case "TAKEN":
        return "#2ecc71";
      case "MISSED":
        return "#e74c3c";
      case "SNOOZED":
        return "#3498db";
      default:
        return "#95a5a6";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return t("reminders.filters.PENDING");
      case "TAKEN":
        return t("reminders.filters.TAKEN");
      case "MISSED":
        return t("reminders.filters.MISSED");
      case "SNOOZED":
        return t("reminders.filters.SNOOZED");
      default:
        return status;
    }
  };

  const isActionable = item.status === "PENDING" || item.status === "SNOOZED";
  const medicationName = item.medicationName || item.name || t("medications.available");
  const dosage = item.medicationDosage || item.dosage || "";
  const time = item.scheduledHour || item.time || t("reminders.addForm.time");

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onView?.(String(item.id))}
      accessibilityLabel={`${t("reminders.title")} ${medicationName}`}
      accessibilityRole="button"
    >
      <View style={styles.cardIcon}>
        <Pill size={20} color={colors.primary} />
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>
            {medicationName}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.cardDetails}>
          {dosage && `${dosage} • `}
          {time}
        </Text>
        {item.snoozedUntil && (
          <Text style={styles.snoozedText}>
            {`${t("reminders.snoozed")}: ${new Date(item.snoozedUntil).toLocaleTimeString()}`}
          </Text>
        )}
      </View>

      {isActionable && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.takenButton]}
            onPress={() => onMarkAsTaken?.(String(item.id))}
            disabled={isMarkingAsTaken}
            accessibilityLabel={t("reminders.markAsTaken")}
            accessibilityRole="button"
          >
            {isMarkingAsTaken ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>{t("reminders.taken")}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.snoozeButton]}
            onPress={() => onSnooze?.(String(item.id), 15)}
            disabled={isSnoozing}
            accessibilityLabel={t("reminders.snooze")}
            accessibilityRole="button"
          >
            {isSnoozing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>⏰</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete?.(String(item.id))}
            disabled={isDeleting}
            accessibilityLabel={t("reminders.delete")}
            accessibilityRole="button"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>🗑</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, gap: 4 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexShrink: 0,
  },
  statusText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fontFamily.medium,
  },
  cardDetails: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
  },
  snoozedText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  takenButton: { backgroundColor: colors.success },
  snoozeButton: { backgroundColor: colors.primary },
  deleteButton: { backgroundColor: colors.error },
  actionButtonText: {
    color: colors.white,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
});
