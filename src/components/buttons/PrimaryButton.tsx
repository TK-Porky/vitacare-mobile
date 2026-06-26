import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontFamily, fontSize } from '../../themes';

type Props = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  onPress?: () => void;
  variant?: 'solid' | 'outline';
  style?: ViewStyle;
  isRound?: boolean;
};

export const PrimaryButton = ({
  label = "Button",
  size = 'md',
  fullWidth = false,
  icon,
  isDisabled = false,
  isLoading = false,
  loadingText = "Chargement...",
  onPress,
  variant = 'solid',
  style,
  isRound = false,
}: Props) => {
  const isButtonDisabled = isDisabled || isLoading;

  const buttonStyle = [
    styles.button,
    isRound ? roundSizeStyles[size] : sizeStyles[size],
    isRound && styles.round,
    fullWidth && styles.fullWidth,
    isButtonDisabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    sizeTextStyles[size],
    isButtonDisabled && styles.textDisabled,
  ];

  const displayText = isLoading ? loadingText : label;

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        style={[styles.outline, ...buttonStyle]}
        onPress={isButtonDisabled ? undefined : onPress}
        disabled={isButtonDisabled}
        activeOpacity={0.85}
      >
        {isLoading && (
          <ActivityIndicator size="small" color={colors.ink} style={{ opacity: 0.6 }} />
        )}
        {icon && !isLoading && <View style={styles.iconContainer}>{icon}</View>}
        {!isRound && <Text style={[styles.outlineText, ...textStyle]}>{displayText}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={isButtonDisabled ? undefined : onPress}
      disabled={isButtonDisabled}
      activeOpacity={isButtonDisabled ? 1 : 0.85}
    >
      <LinearGradient
        colors={isButtonDisabled
          ? ['#ccc', '#aaa', '#999']
          : [colors.gradientStart, colors.gradientMid1, colors.gradientStart]
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.solid, isRound ? roundSizeStyles[size] : sizeStyles[size], fullWidth && styles.fullWidth]}
      >
        {isLoading && <ActivityIndicator size="small" color={colors.white} />}
        {icon && !isLoading && <View style={styles.iconContainer}>{icon}</View>}
        {!isRound && <Text style={[styles.solidText, ...textStyle]}>{displayText}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const sizeStyles = {
  sm: { minHeight: 40 },
  md: { minHeight: 48 },
  lg: { minHeight: 56 },
};

const roundSizeStyles = {
  sm: { width: 40, height: 40 },
  md: { width: 48, height: 48 },
  lg: { width: 56, height: 56 },
};

const sizeTextStyles = {
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.base },
  lg: { fontSize: fontSize.lg },
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  button: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: {
    width: '100%',
    height: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  solid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  solidText: {
    color: colors.white,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  outline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  outlineText: {
    color: colors.inkLight,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  text: {
    fontFamily: fontFamily.semiBold,
  },
  textDisabled: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});