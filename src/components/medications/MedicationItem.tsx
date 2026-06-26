import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pill } from 'lucide-react-native';
import { colors, fontFamily, fontSize } from '../../themes';

type Status = 'taken' | 'missed' | 'pending';

type Props = {
  name: string;
  dose: string;
  status: Status;
  time: string;
  onPress?: () => void;
};

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  taken:   { label: 'Pris',    color: colors.success },
  missed:  { label: 'Manqué', color: colors.error },
  pending: { label: 'À venir', color: colors.inkLight },
};

export function MedicationItem({ name, dose, status, time, onPress }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.iconWrapper}>
        <Pill size={18} color={colors.inkLight} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.dose}>{dose}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.time}>{time}</Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
          {status === 'missed' && (
            <View style={styles.alertDot}>
              <Text style={styles.alertText}>!</Text>
            </View>
          )}
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
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  dose: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  alertDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: colors.white,
  },
});
