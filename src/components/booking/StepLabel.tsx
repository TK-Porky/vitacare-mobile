import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, fontFamily, fontSize } from '../../themes';

type Props = {
  number: number;
  label: string;
};

export const StepLabel = ({ number, label }: Props) => (
  <View style={styles.stepLabelRow}>
    <View style={styles.stepNumberBadge}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <Text style={styles.stepLabelText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  stepLabelText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
});
