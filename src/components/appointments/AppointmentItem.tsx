import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, fontFamily, fontSize } from '../../themes';

type Props = {
  doctorName: string;
  date: string;
  time: string;
  status: string;
  avatarUrl?: string;
  onPress?: () => void;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  confirmed:   { label: 'Confirmé',   bg: colors.successLight, color: colors.success },
  paid:        { label: 'Payé',       bg: colors.successLight, color: colors.success },
  pending:     { label: 'En attente', bg: colors.warningLight, color: colors.warning },
  cancelled:   { label: 'Annulé',     bg: colors.errorLight,   color: colors.error },
  completed:   { label: 'Terminé',    bg: colors.infoLight,    color: colors.info },
  in_progress: { label: 'En cours',   bg: colors.infoLight,    color: colors.info },
  no_show:     { label: 'Absent',     bg: colors.errorLight,   color: colors.error },
  rescheduled: { label: 'Reporté',    bg: colors.warningLight, color: colors.warning },
};

export function AppointmentItem({ doctorName, date, time, status, avatarUrl, onPress }: Props) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? STATUS_CONFIG.pending;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.avatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {doctorName.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{doctorName}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.time}>{time}</Text>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Text style={[styles.badgeText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.inkLight,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  date: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  time: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
});
