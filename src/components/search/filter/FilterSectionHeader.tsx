import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../../themes';

type Props = {
  title: string;
  subtitle?: string;
  isOpen?: boolean;
  onToggle?: () => void;
};

export const FilterSectionHeader = ({
  title,
  subtitle,
  isOpen = true,
  onToggle,
}: Props) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={0.7}
      disabled={!onToggle}
    >
      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onToggle && (
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.inkMuted}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
});
