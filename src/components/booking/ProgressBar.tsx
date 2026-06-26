import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { colors } from '../../themes';

type Props = {
  step: number;
  total: number;
};

export const ProgressBar = ({ step, total }: Props) => (
  <View style={styles.progressBarTrack}>
    <View style={[styles.progressBarFill, { width: `${(step / total) * 100}%` }]} />
  </View>
);

const styles = StyleSheet.create({
  progressBarTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
