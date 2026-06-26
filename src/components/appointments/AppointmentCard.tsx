import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../themes';
import { Appointment } from '../../types/appointment';
import { Skeleton } from '../generics';

interface AppointmentCardProps {
  item: Appointment;
  onPress?: () => void;
}

const getStatusIconAndColor = (status: Appointment['status']): { icon: keyof typeof Ionicons.glyphMap; color: string } | null => {
  switch (status) {
    case 'confirmed':
      return { icon: 'checkmark', color: colors.success };
    case 'paid':
      return { icon: 'checkmark', color: colors.info };
    case 'pending':
      return { icon: 'time', color: colors.warning };
    case 'cancelled':
      return { icon: 'close', color: colors.error };
    default:
      return null;
  }
};

export function AppointmentCard({ item, onPress }: AppointmentCardProps) {
  const statusInfo = getStatusIconAndColor(item.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Header: avatar + name + badge */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.doctorAvatarUri || item.avatarUri }} style={styles.avatar} />
          {statusInfo && (
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon} size={10} color={colors.white} />
            </View>
          )}
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.doctorName}>{item.doctorName}</Text>
          <Text style={styles.motif} numberOfLines={1}>{item.motif}</Text>
        </View>
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>

      {/* Clinic info */}
      <View style={styles.clinicRow}>
        <Ionicons name="business" size={14} color={colors.inkLight} />
        <Text style={styles.clinicName}>{item.clinic}</Text>
      </View>
      <View style={[styles.clinicRow, { marginTop: 4 }]}>
        <Ionicons name="location-outline" size={14} color={colors.inkLight} />
        <Text style={styles.clinicAddress}>{item.address}</Text>
      </View>

      {/* Date / Time */}
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeBlock}>
          <Text style={styles.dateTimeLabel}>Date</Text>
          <Text style={styles.dateTimeValue}>{item.date}</Text>
        </View>
        <View style={styles.dateTimeSeparator} />
        <View style={styles.dateTimeBlock}>
          <Text style={styles.dateTimeLabel}>Heure</Text>
          <Text style={styles.dateTimeValue}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function AppointmentCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header Skeleton */}
      <View style={styles.cardHeader}>
        <Skeleton width={42} height={42} borderRadius={21} />
        <View style={[styles.cardHeaderText, { gap: 4, marginLeft: 10 }]}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="40%" height={14} />
        </View>
        <Skeleton width={70} height={24} borderRadius={12} />
      </View>

      {/* Clinic info */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Skeleton width={16} height={16} />
          <Skeleton width="60%" height={14} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Skeleton width={16} height={16} />
          <Skeleton width="80%" height={14} />
        </View>
      </View>

      {/* Date / Time */}
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeBlock}>
          <Skeleton width="30%" height={12} style={{ marginBottom: 4 }} />
          <Skeleton width="65%" height={14} />
        </View>
        <View style={styles.dateTimeSeparator} />
        <View style={styles.dateTimeBlock}>
          <Skeleton width="30%" height={12} style={{ marginBottom: 4 }} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.07)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  doctorName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
    marginBottom: 2,
  },
  motif: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  badge: {
    backgroundColor: colors.successLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.success,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  clinicName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  clinicAddress: {
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 0,
  },
  dateTimeBlock: {
    flex: 1,
  },
  dateTimeSeparator: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  dateTimeLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontFamily: fontFamily.medium,
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
});
