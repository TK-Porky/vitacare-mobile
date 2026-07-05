import { NotificationCategory } from "@/types";
import { Ionicons } from "@expo/vector-icons";

export const CATEGORY_META: Record<
  NotificationCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  appointment_reminder: {
    icon: "calendar-outline",
    color: "#0D9488",
    label: "Rendez-vous",
  },
  appointment_confirmed: {
    icon: "checkmark-circle-outline",
    color: "#16A34A",
    label: "Confirmé",
  },
  appointment_cancelled: {
    icon: "close-circle-outline",
    color: "#DC2626",
    label: "Annulé",
  },
  treatment_reminder: {
    icon: "medical-outline",
    color: "#7C3AED",
    label: "Traitement",
  },
  treatment_refill: {
    icon: "refresh-outline",
    color: "#EA580C",
    label: "Renouvellement",
  },
  health_tip: {
    icon: "bulb-outline",
    color: "#CA8A04",
    label: "Conseil santé",
  },
  system: {
    icon: "information-circle-outline",
    color: "#6B7280",
    label: "Système",
  },
};
