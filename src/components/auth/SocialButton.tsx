import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";

interface SocialLoginProps {
  onGooglePress?: () => void;
  onApplePress?: () => void;
  onFacebookPress?: () => void;
}

export function SocialLogin({
  onGooglePress,
  onApplePress,
  onFacebookPress,
}: SocialLoginProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>{t("common.or")}</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialContainer}>
        {onGooglePress && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={onGooglePress}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={24} color="#DB4437" />
          </TouchableOpacity>
        )}

        {onApplePress && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={onApplePress}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-apple" size={24} color={colors.ink} />
          </TouchableOpacity>
        )}

        {onFacebookPress && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={onFacebookPress}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    paddingHorizontal: 16,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
