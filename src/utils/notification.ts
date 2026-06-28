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
    label: "Rendez-vous",
  },
  appointment_confirmed: {
    icon: "checkmark-circle-outline",
    color: colors.success,
    label: "Confirmé",
  },
  appointment_cancelled: {
    icon: "close-circle-outline",
    color: colors.danger,
    label: "Annulé",
  },
  treatment_reminder: {
    icon: "medical-outline",
    color: colors.blue,
    label: "Traitement",
  },
  treatment_refill: {
    icon: "refresh-outline",
    color: colors.purple,
    label: "Renouvellement",
  },
  health_tip: { icon: "bulb-outline", color: colors.warning, label: "Conseil" },
  system: {
    icon: "information-circle-outline",
    color: colors.gray400,
    label: "Système",
  },
};
