import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, fontSize, fontFamily } from '../../themes';

interface MonthHeaderProps {
  monthLabel: string;
  count: number;
}

export function MonthHeader({ monthLabel, count }: MonthHeaderProps) {
  return (
    <View style={styles.monthRow}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <View style={styles.monthLine} />
      <Text style={styles.monthCount}>{count} Rendez-vous</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  monthLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.inkLight,
  },
  monthLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  monthCount: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },
});
