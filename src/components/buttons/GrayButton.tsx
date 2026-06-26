import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../themes';

type GrayButtonProps = {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
};

export const GrayButton = ({
  label,
  icon,
  onPress,
  style,
  textStyle,
  disabled = false,
}: GrayButtonProps) => {
  const hasOnlyIcon = icon && !label;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        hasOnlyIcon && styles.iconOnlyButton,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={disabled ? colors.inkMuted : colors.ink}
        />
      )}
      {label && (
        <Text
          style={[
            styles.buttonText,
            disabled && styles.buttonTextDisabled,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconOnlyButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
    borderColor: colors.border,
  },
  buttonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  buttonTextDisabled: {
    color: colors.inkMuted,
  },
});