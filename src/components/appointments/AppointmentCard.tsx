import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";
import { Appointment } from "@/types/appointment";
import { Skeleton } from "@/components/generics";
import { AppointmentStatus } from "@/types/api-responses";
import { parseAppointmentDate } from "@/utils/formatDate";

interface AppointmentCardProps {
  item: Appointment;
  onPress?: () => void;
  onRebook?: () => void;
}

const LEFT_BG: Record<AppointmentStatus, string> = {
  CONFIRMED: colors.success,
  PENDING: colors.warning,
  PAID: colors.info,
  CANCELLED: colors.error,
  COMPLETED: colors.success,
  RESCHEDULED: colors.blue,
  NO_SHOW: colors.purple,
  IN_PROGRESS: colors.blue,
};

const STATUS_CONFIG: Record<
  AppointmentStatus,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bg: string;
    label: string;
  }
> = {
  CONFIRMED: {
    icon: "checkmark",
    color: colors.success,
    bg: colors.successLight,
    label: "Confirmé",
  },
  PAID: {
    icon: "checkmark",
    color: colors.info,
    bg: colors.infoLight,
    label: "Payé",
  },
  PENDING: {
    icon: "time",
    color: colors.warning,
    bg: colors.warningLight,
    label: "En attente",
  },
  CANCELLED: {
    icon: "close",
    color: colors.error,
    bg: colors.errorLight,
    label: "Annulé",
  },
  RESCHEDULED: {
    icon: "refresh",
    color: colors.blue,
    bg: colors.blueLight,
    label: "Reporté",
  },
  NO_SHOW: {
    icon: "person",
    color: colors.purple,
    bg: colors.purpleLight,
    label: "Non présenté",
  },
  COMPLETED: {
    icon: "checkmark",
    color: colors.success,
    bg: colors.successLight,
    label: "Terminé",
  },
  IN_PROGRESS: {
    icon: "checkmark",
    color: colors.warning,
    bg: colors.warningLight,
    label: "En cours",
  },
};

const isPast = (s: AppointmentStatus) => s === "PAID" || s === "CANCELLED";

// ─── Sous-composants ─────────────────────────────────────────────────────────
function Initials({
  name,
  bg,
  color,
}: {
  name: string;
  bg: string;
  color: string;
}) {
  const txt = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <View style={[styles.avatar, { backgroundColor: bg }]}>
      <Text style={{ color, fontSize: 11, fontFamily: fontFamily.semiBold }}>
        {txt}
      </Text>
    </View>
  );
}

function SectionHeader({ month, count }: { month: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionMonth}>{month}</Text>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionCount}>
        {count} rendez-vous{count > 1 ? "" : ""}
      </Text>
    </View>
  );
}

// ─── AppointmentCard ─────────────────────────────────────────────────────────
interface AppointmentCardProps {
  item: Appointment;
  onPress?: () => void;
  onRebook?: () => void;
  onReview?: () => void;
}

export const AppointmentCard = React.memo(function AppointmentCard({
  item,
  onPress,
  onRebook,
  onReview,
}: AppointmentCardProps) {
  const cfg = STATUS_CONFIG[item.status];
  const leftBg = LEFT_BG[item.status];
  const past = isPast(item.status);
  const avatarUri = item.doctorAvatarUri || item.avatarUri;

  // Format id
  const idLabel = `#${String(item.id).padStart(3, "0")}`;
  // Séparer jour / mois depuis item.date  ("2 Juil" → day="2" month="JUIL")
  const { day, month } = parseAppointmentDate(item.date);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* ── Bloc gauche coloré ── */}
      <View
        style={[
          styles.colLeft,
          { backgroundColor: leftBg, opacity: past ? 0.72 : 1 },
        ]}
      >
        <Text style={styles.leftId}>{idLabel}</Text>
        <Text style={styles.leftDay}>{day}</Text>
        <Text style={styles.leftMonth}>{month?.toUpperCase()}</Text>
        <Text style={styles.leftTime}>{item.time}</Text>
      </View>

      {/* ── Partie droite blanche ── */}
      <View style={[styles.colRight, past && styles.dimmed]}>
        {/* Ligne : avatar + nom + badge/action */}
        <View style={styles.rightTop}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <Initials name={item.doctorName} bg={cfg.bg} color={cfg.color} />
          )}
          <Text style={styles.rightName} numberOfLines={1}>
            {item.doctorName}
          </Text>

          {/* Action selon statut */}
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusLabel, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* Adresse */}
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={11} color={colors.inkLight} />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.clinic}, {item.address}
          </Text>
        </View>

        {/* Motif */}
        <Text style={styles.reason} numberOfLines={1}>
          {item.reason}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function AppointmentCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.colLeft, { backgroundColor: colors.border }]}>
        <Skeleton width={28} height={11} borderRadius={4} />
        <Skeleton
          width={28}
          height={28}
          borderRadius={4}
          style={{ marginTop: 3 }}
        />
        <Skeleton
          width={28}
          height={11}
          borderRadius={4}
          style={{ marginTop: 2 }}
        />
        <Skeleton
          width={24}
          height={10}
          borderRadius={4}
          style={{ marginTop: 2 }}
        />
      </View>
      <View style={styles.colRight}>
        <View style={styles.rightTop}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width="50%" height={14} borderRadius={4} />
          <Skeleton width={52} height={22} borderRadius={11} />
        </View>
        <Skeleton width="70%" height={11} borderRadius={4} />
        <Skeleton width="45%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    marginTop: 10,
  },
  sectionMonth: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  sectionLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.border,
  },
  sectionCount: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },

  // Card
  card: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    height: 110,
    marginBottom: 10,
  },

  // Colonne gauche
  colLeft: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: "relative",
    borderRadius: 16,
  },
  leftId: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  leftDay: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bold,
    color: "#fff",
    lineHeight: 32,
  },
  leftMonth: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.8,
  },
  leftTime: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },
  leftArrow: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Colonne droite
  colRight: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: 0,
    borderRadius: 16,
  },
  dimmed: { opacity: 0.65 },

  rightTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  rightName: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },

  // Status badge (upcoming)
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
  },

  // Bouton Avis (past PAID)
  btnReview: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  btnReviewText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: "#fff",
  },

  // Bouton Reprendre (cancelled)
  btnRebook: {
    backgroundColor: colors.successLight ?? colors.successLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  btnRebookText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addressText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.inkLight,
  },
  reason: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },
});
