import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../themes';

type Props = {
  onPress?: () => void;
  style?: ViewStyle;
};

export const BackButton = ({ onPress, style }: Props) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="arrow-back" size={20} color={colors.ink} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});