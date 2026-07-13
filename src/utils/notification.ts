import i18next from "@/i18n";
import { colors } from "@/themes";
import { Ionicons } from "@expo/vector-icons";
import type { NotificationCategory } from "@/types";

export const CATEGORY_META: Record<
  NotificationCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  appointment_reminder: {
    icon: "calendar-outline",
    color: colors.success,
    label: i18next.t('notifications.categoryLabels.appointment_reminder'),
  },
  appointment_confirmed: {
    icon: "checkmark-circle-outline",
    color: colors.success,
    label: i18next.t('notifications.categoryLabels.appointment_confirmed'),
  },
  appointment_cancelled: {
    icon: "close-circle-outline",
    color: colors.danger,
    label: i18next.t('notifications.categoryLabels.appointment_cancelled'),
  },
  treatment_reminder: {
    icon: "medical-outline",
    color: colors.blue,
    label: i18next.t('notifications.categoryLabels.treatment_reminder'),
  },
  treatment_refill: {
    icon: "refresh-outline",
    color: colors.purple,
    label: i18next.t('notifications.categoryLabels.treatment_refill'),
  },
  health_tip: {
    icon: "bulb-outline",
    color: colors.warning,
    label: i18next.t('notifications.categoryLabels.health_tip'),
  },
  system: {
    icon: "information-circle-outline",
    color: colors.gray400,
    label: i18next.t('notifications.categoryLabels.system'),
  },
};
