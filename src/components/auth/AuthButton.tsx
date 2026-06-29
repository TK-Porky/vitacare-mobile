import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { colors, fontFamily, fontSize } from "@/themes";

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function AuthButton({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  size = "md",
}: AuthButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
        };
      case "secondary":
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
        };
      case "outline":
        return {
          container: styles.outlineContainer,
          text: styles.outlineText,
        };
      case "ghost":
        return {
          container: styles.ghostContainer,
          text: styles.ghostText,
        };
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          container: { paddingVertical: 8, paddingHorizontal: 16 },
          text: { fontSize: fontSize.sm },
        };
      case "lg":
        return {
          container: { paddingVertical: 16, paddingHorizontal: 24 },
          text: { fontSize: fontSize.lg },
        };
      default:
        return {
          container: { paddingVertical: 14, paddingHorizontal: 20 },
          text: { fontSize: fontSize.md },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.baseContainer,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabledContainer,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.white : colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text
            style={[
              styles.baseText,
              variantStyles.text,
              sizeStyles.text,
              disabled && styles.disabledText,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  disabledContainer: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconWrapper: {
    marginRight: 4,
  },
  baseText: {
    fontFamily: fontFamily.semiBold,
    textAlign: "center",
  },
  disabledText: {
    opacity: 0.5,
  },
  // Primary variant
  primaryContainer: {
    backgroundColor: colors.black,
  },
  primaryText: {
    color: colors.white,
  },
  // Secondary variant
  secondaryContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.ink,
  },
  // Outline variant
  outlineContainer: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  outlineText: {
    color: colors.ink,
  },
  // Ghost variant
  ghostContainer: {
    backgroundColor: "transparent",
  },
  ghostText: {
    color: colors.primary,
  },
});
