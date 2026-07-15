import i18next from "@/i18n";
import { NotificationCategory } from "@/types";
import { Ionicons } from "@expo/vector-icons";

export const CATEGORY_META: Record<
  NotificationCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  appointment_reminder: {
    icon: "calendar-outline",
    color: "#0D9488",
    label: i18next.t('notifications.categoryLabels.appointment_reminder'),
  },
  appointment_confirmed: {
    icon: "checkmark-circle-outline",
    color: "#16A34A",
    label: i18next.t('notifications.categoryLabels.appointment_confirmed'),
  },
  appointment_cancelled: {
    icon: "close-circle-outline",
    color: "#DC2626",
    label: i18next.t('notifications.categoryLabels.appointment_cancelled'),
  },
  treatment_reminder: {
    icon: "medical-outline",
    color: "#7C3AED",
    label: i18next.t('notifications.categoryLabels.treatment_reminder'),
  },
  treatment_refill: {
    icon: "refresh-outline",
    color: "#EA580C",
    label: i18next.t('notifications.categoryLabels.treatment_refill'),
  },
  health_tip: {
    icon: "bulb-outline",
    color: "#CA8A04",
    label: i18next.t('notifications.categoryLabels.health_tip'),
  },
  system: {
    icon: "information-circle-outline",
    color: "#6B7280",
    label: i18next.t('notifications.categoryLabels.system'),
  },
};
