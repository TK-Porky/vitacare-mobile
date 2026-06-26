import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, fontFamily, fontSize } from '../../../themes';

type Props = {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export const FilterChip = ({
  label,
  isSelected = false,
  onPress,
  style,
}: Props) => {
  return (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    backgroundColor: colors.white,
  },
  chipSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryDark,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  labelSelected: {
    color: colors.white,
  },
});
