import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PasswordInput, HelperText, EmailInput } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthButton } from "@/components/auth/AuthButton";
import { useTranslation } from "react-i18next";
import { colors, fontFamily, fontSize } from "@/themes";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store";

// ================================================================================== //
// Main
// ================================================================================== //
export default function LoginEmailScreen() {
  const { t } = useTranslation();
  // ================================================================================== //
  // States
  // ================================================================================== //
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const { loginEmail, isLoggingInEmail, googleLogin, isGoogleLoading } =
    useAuth();
  const storeError = useAuthStore((state) => state.error);
  const clearStoreError = useAuthStore((state) => state.clearError);

  // ================================================================================== //
  // Effects
  // ================================================================================== //
  useEffect(() => {
    clearStoreError();
  }, []);

  // ================================================================================== //
  // Functions
  // ================================================================================== //

  const validate = useCallback(() => {
    if (!email.trim() || !email.includes("@")) {
      setLocalError(t("auth.loginEmail.invalidEmail"));
      return false;
    }
    if (password.length < 8) {
      setLocalError(t("auth.loginEmail.invalidPassword"));
      return false;
    }
    return true;
  }, [email, password, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setLocalError("");
    clearStoreError();

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await loginEmail({ email, password, rememberMe });
  }, [email, password, rememberMe, validate, clearStoreError, loginEmail]);

  const handleGoogleLogin = useCallback(async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await googleLogin();
  }, [googleLogin]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleForgotPassword = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(auth)/forgot-password");
  }, []);

  const handleSignUp = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(auth)/register");
  }, []);

  const handleTerms = useCallback(() => {
    router.push("/terms");
  }, []);

  const handlePrivacy = useCallback(() => {
    router.push("/privacy");
  }, []);

  // ================================================================================== //
  // Render
  // ================================================================================== //

  const isLoading = isLoggingInEmail || isGoogleLoading;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar
        translucent
        backgroundColor={colors.white}
        barStyle="dark-content"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Header ── */}
        <AuthHeader
          title={t("auth.loginEmail.title")}
          subtitle={t("auth.loginEmail.subtitle")}
          showBack
          onBack={handleBack}
        />

        {/* ── Form ── */}
        <View style={styles.form}>
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>
              {t("auth.loginEmail.emailLabel")} <Text style={styles.required}>*</Text>
            </Text>
            <EmailInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (localError) setLocalError("");
                if (storeError) clearStoreError();
              }}
              placeholder={t("auth.loginEmail.emailPlaceholder")}
              autoFocus
            />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>
              {t("auth.loginEmail.passwordLabel")} <Text style={styles.required}>*</Text>
            </Text>
            <PasswordInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (localError) setLocalError("");
                if (storeError) clearStoreError();
              }}
              placeholder={t("auth.loginEmail.passwordPlaceholder")}
            />
          </View>

          <View style={styles.rememberRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleForgotPassword}
              accessibilityLabel={t("auth.loginEmail.accessibilityForgotPassword")}
              accessibilityRole="button"
            >
              <Text style={styles.forgotText}>{t("auth.loginEmail.forgotPassword")}</Text>
            </TouchableOpacity>
          </View>

          {(localError || storeError) && (
            <HelperText
              message={localError || (storeError as string)}
              type="error"
            />
          )}
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <AuthButton
            label={t("auth.loginEmail.loginButton")}
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
            size="lg"
            icon={
              <Ionicons name="log-in-outline" size={18} color={colors.white} />
            }
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t("auth.loginEmail.or")}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[
              styles.googleButton,
              isLoading && styles.googleButtonDisabled,
            ]}
            onPress={handleGoogleLogin}
            activeOpacity={0.7}
            disabled={isLoading}
            accessibilityLabel={t("auth.loginEmail.accessibilityGoogleLogin")}
            accessibilityRole="button"
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#f44242ff" />
                <Text style={styles.googleText}>{t("auth.loginEmail.googleButton")}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t("auth.loginEmail.noAccount")}{" "}
            <Text style={styles.legalLink} onPress={handleSignUp}>
              {t("auth.loginEmail.signUp")}
            </Text>
          </Text>

          <Text style={styles.legal}>
            {(() => {
              const legalText = t("auth.loginEmail.legalNotice", { terms: "||TERMS||", privacy: "||PRIVACY||" });
              const [before, afterTerms] = legalText.split("||TERMS||");
              const [middle, afterPrivacy] = afterTerms.split("||PRIVACY||");
              return (
                <>
                  <Text>{before}</Text>
                  <Text style={styles.legalLink} onPress={handleTerms}>{t("auth.loginEmail.terms")}</Text>
                  <Text>{middle}</Text>
                  <Text style={styles.legalLink} onPress={handlePrivacy}>{t("auth.loginEmail.privacy")}</Text>
                  <Text>{afterPrivacy}</Text>
                </>
              );
            })()}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  root: {
    marginTop: 30,
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 60 : 40,
  },

  // Form
  form: {
    marginTop: 24,
    gap: 20,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  required: {
    color: colors.error || "#E53935",
  },
  fieldWrapper: {
    gap: 6,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  forgotText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },

  // Actions
  actions: {
    marginTop: 32,
    gap: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },

  // Footer
  footer: {
    marginTop: 24,
    gap: 16,
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  footerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },

  // Legal
  legal: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 17,
  },
  legalLink: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
});
