// app/(auth)/forgot-password.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PasswordInput, HelperText, EmailInput, OTPInput } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthButton } from "@/components/auth/AuthButton";
import { colors, fontFamily, fontSize } from "@/themes";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store";

// ================================================================================== //
// Types
// ================================================================================== //
type Step = "email" | "otp" | "reset" | "success";

const STEP_INDEX: Record<Step, number> = {
  email: 0,
  otp: 1,
  reset: 2,
  success: 3,
};

// ================================================================================== //
// Components
// ================================================================================== //

/**
 * Step dots component
 */
function StepDots({ step }: { step: Step }) {
  if (step === "success") return null;

  const active = STEP_INDEX[step];
  return (
    <View style={dots.row}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[dots.dot, i <= active ? dots.dotActive : dots.dotInactive]}
        />
      ))}
    </View>
  );
}

const dots = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, marginTop: 8 },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  dotActive: { backgroundColor: colors.primary },
  dotInactive: { backgroundColor: colors.border },
});

/**
 * Password strength component - Optimized with useMemo
 */
function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = useMemo(() => {
    if (!password) {
      return { score: 0, label: "", color: colors.border };
    }

    const calculatedScore = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    const labels = ["", "Faible", "Moyen", "Fort", "Très fort"];
    const segColors = [
      colors.error,
      colors.warning || "#F59E0B",
      colors.primary,
      colors.primary,
    ];

    return {
      score: calculatedScore,
      label: labels[calculatedScore] || "",
      color:
        calculatedScore > 0 ? segColors[calculatedScore - 1] : colors.border,
    };
  }, [password]);

  if (!password) return null;

  return (
    <View style={strength.wrapper}>
      <View style={strength.bar}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              strength.segment,
              {
                backgroundColor: i <= score ? color : colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[strength.label, { color }]}>{label}</Text>
    </View>
  );
}

const strength = StyleSheet.create({
  wrapper: { gap: 4, marginTop: 4 },
  bar: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 3, borderRadius: 2 },
  label: { fontFamily: fontFamily.regular, fontSize: fontSize.xs },
});

// ================================================================================== //
// Main
// ================================================================================== //
export default function ForgotPasswordScreen() {
  // ================================================================================== //
  // States
  // ================================================================================== //
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const {
    forgotPassword,
    isSendingReset,
    verifyPasswordResetOtp,
    isVerifyingResetOtp,
    resetPassword,
    isResettingPassword,
  } = useAuth();
  const storeError = useAuthStore((state) => state.error);
  const clearStoreError = useAuthStore((state) => state.clearError);

  // ================================================================================== //
  // Effects
  // ================================================================================== //
  useEffect(() => {
    clearStoreError();
    setLocalErrors({}); // ✅ Nettoyer les erreurs locales entre les étapes
  }, [step, clearStoreError]);

  // ✅ Cooldown timer pour le bouton "Renvoyer"
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // ================================================================================== //
  // Functions
  // ================================================================================== //

  const clearError = useCallback(
    (key: string) => {
      setLocalErrors((e) => ({ ...e, [key]: "" }));
      if (storeError) clearStoreError();
    },
    [storeError, clearStoreError],
  );

  const handleBack = useCallback(() => {
    const prev: Partial<Record<Step, Step>> = {
      otp: "email",
      reset: "otp",
    };
    const previous = prev[step];
    if (previous) {
      setStep(previous);
    } else {
      router.back();
    }
  }, [step]);

  const handleEmailSubmit = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Adresse email invalide.";
    }
    setLocalErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await forgotPassword(email);
      setStep("otp");
    } catch {
      // Error handled by storeError
    }
  }, [email, forgotPassword]);

  // ✅ Soumission automatique de l'OTP après 6 chiffres
  const handleOtpChange = useCallback(
    (val: string) => {
      setOtp(val);
      clearError("otp");

      // ✅ Soumission automatique après 6 chiffres
      if (val.length === 6 && !isVerifyingResetOtp) {
        // Petit délai pour permettre à l'utilisateur de voir le dernier chiffre
        setTimeout(() => {
          handleOtpSubmit();
        }, 300);
      }
    },
    [clearError, isVerifyingResetOtp],
  );

  const handleOtpSubmit = useCallback(async () => {
    if (otp.length < 6) {
      setLocalErrors({ otp: "Veuillez entrer le code complet." });
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    setLocalErrors({});

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await verifyPasswordResetOtp({ email, otp });
      setStep("reset");
    } catch {
      // Error handled by storeError
    }
  }, [otp, email, verifyPasswordResetOtp]);

  const handleResetSubmit = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    if (password.length < 8) {
      newErrors.password = "Minimum 8 caractères.";
    } else if (password.includes(" ")) {
      newErrors.password = "Le mot de passe ne doit pas contenir d'espaces.";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    } else if (confirmPassword && confirmPassword.includes(" ")) {
      newErrors.confirmPassword =
        "Le mot de passe ne doit pas contenir d'espaces.";
    }
    setLocalErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await resetPassword({ email, password });
      setStep("success");
    } catch {
      // Error handled by storeError
    }
  }, [password, confirmPassword, email, resetPassword]);

  const handleLogin = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace("/(auth)/login-email");
  }, []);

  // ✅ Resend avec cooldown
  const handleResendCode = useCallback(async () => {
    if (cooldown > 0 || isSendingReset || isResending) return;

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsResending(true);
    setCooldown(30);

    try {
      await forgotPassword(email);
      // Optionnel: Afficher un message de succès
    } catch (error) {
      // L'erreur est gérée par storeError
      setCooldown(0);
    } finally {
      setIsResending(false);
    }
  }, [cooldown, isSendingReset, isResending, forgotPassword, email]);

  const handleBackToLogin = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(auth)/login-email");
  }, []);

  // ================================================================================== //
  // Render
  // ================================================================================== //

  const isEmailStep = step === "email";
  const isOtpStep = step === "otp";
  const isResetStep = step === "reset";
  const isSuccessStep = step === "success";

  const isResendingOrCooldown = isResending || cooldown > 0;
  const resendButtonText = isResending
    ? "Envoi en cours..."
    : cooldown > 0
      ? `Renvoyer (${cooldown}s)`
      : "Renvoyer le code";

  return (
    <KeyboardAvoidingView
      style={styles.root}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Header ── */}
        <AuthHeader
          title={
            isEmailStep
              ? "Mot de passe oublié"
              : isOtpStep
                ? "Vérification"
                : isResetStep
                  ? "Nouveau mot de passe"
                  : "Réinitialisation réussie"
          }
          subtitle={
            isEmailStep
              ? "Entrez votre adresse email pour réinitialiser votre mot de passe"
              : isOtpStep
                ? `Un code a été envoyé à ${email}`
                : isResetStep
                  ? "Choisissez un mot de passe sécurisé"
                  : "Votre mot de passe a été réinitialisé avec succès"
          }
          showBack={!isSuccessStep}
          onBack={handleBack}
        />

        {/* ── Step Dots ── */}
        <StepDots step={step} />

        {/* ── Contenu ── */}
        <View style={styles.content}>
          {/* ── Étape 1 : Email ── */}
          {isEmailStep && (
            <View style={styles.form}>
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>
                  Adresse email <Text style={styles.required}>*</Text>
                </Text>
                <EmailInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError("email");
                  }}
                  placeholder="exemple@email.com"
                  error={!!localErrors.email || !!storeError}
                  autoFocus
                />
                {localErrors.email && (
                  <HelperText message={localErrors.email} type="error" />
                )}
                {storeError && !localErrors.email && (
                  <HelperText message={storeError as string} type="error" />
                )}
                {!localErrors.email && !storeError && (
                  <HelperText
                    message="Un code de vérification sera envoyé à cette adresse"
                    type="info"
                  />
                )}
              </View>
            </View>
          )}

          {/* ── Étape 2 : OTP ── */}
          {isOtpStep && (
            <View style={styles.form}>
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>
                  Code à 6 chiffres <Text style={styles.required}>*</Text>
                </Text>
                <OTPInput
                  length={6}
                  value={otp}
                  onChange={handleOtpChange}
                  error={!!localErrors.otp || !!storeError}
                  autoFocus
                />
                {localErrors.otp && (
                  <HelperText message={localErrors.otp} type="error" />
                )}
                {storeError && !localErrors.otp && (
                  <HelperText message={storeError as string} type="error" />
                )}
              </View>

              <TouchableOpacity
                onPress={handleResendCode}
                disabled={isResendingOrCooldown || isSendingReset}
                style={styles.resendButton}
                accessibilityLabel={
                  isResending ? "Envoi en cours" : "Renvoyer le code"
                }
                accessibilityRole="button"
                accessibilityState={{ disabled: isResendingOrCooldown }}
              >
                <Text style={styles.resendText}>
                  Pas reçu ?{" "}
                  <Text
                    style={[
                      styles.resendLink,
                      (isResendingOrCooldown || isSendingReset) &&
                        styles.resendLinkDisabled,
                    ]}
                  >
                    {resendButtonText}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Étape 3 : Nouveau mot de passe ── */}
          {isResetStep && (
            <View style={styles.form}>
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>
                  Nouveau mot de passe <Text style={styles.required}>*</Text>
                </Text>
                <PasswordInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError("password");
                  }}
                  placeholder="Minimum 8 caractères"
                  error={!!localErrors.password}
                />
                <PasswordStrength password={password} />
                {localErrors.password && (
                  <HelperText message={localErrors.password} type="error" />
                )}
                <Text style={styles.hint}>
                  • Minimum 8 caractères
                  {"\n"}• Au moins une majuscule
                  {"\n"}• Au moins un chiffre
                  {"\n"}• Sans espaces
                </Text>
              </View>

              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>
                  Confirmer le mot de passe{" "}
                  <Text style={styles.required}>*</Text>
                </Text>
                <PasswordInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearError("confirmPassword");
                  }}
                  placeholder="Confirmez votre mot de passe"
                  error={!!localErrors.confirmPassword}
                />
                {localErrors.confirmPassword && (
                  <HelperText
                    message={localErrors.confirmPassword}
                    type="error"
                  />
                )}
              </View>

              {storeError && (
                <HelperText message={storeError as string} type="error" />
              )}
            </View>
          )}

          {/* ── Étape 4 : Succès ── */}
          {isSuccessStep && (
            <View style={styles.success}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={48} color={colors.white} />
              </View>
              <View style={styles.successText}>
                <Text style={styles.successTitle}>Mot de passe modifié !</Text>
                <Text style={styles.successSubtitle}>
                  Votre mot de passe a été réinitialisé avec succès. Vous pouvez
                  maintenant vous connecter.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          {isEmailStep && (
            <AuthButton
              label="Envoyer le code"
              onPress={handleEmailSubmit}
              variant="primary"
              fullWidth
              loading={isSendingReset}
              size="lg"
              icon={
                <Ionicons name="send-outline" size={18} color={colors.white} />
              }
            />
          )}

          {isOtpStep && (
            <AuthButton
              label="Vérifier"
              onPress={handleOtpSubmit}
              variant="primary"
              fullWidth
              loading={isVerifyingResetOtp}
              size="lg"
              icon={
                <Ionicons
                  name="checkmark-outline"
                  size={18}
                  color={colors.white}
                />
              }
            />
          )}

          {isResetStep && (
            <AuthButton
              label="Réinitialiser"
              onPress={handleResetSubmit}
              variant="primary"
              fullWidth
              loading={isResettingPassword}
              size="lg"
              icon={
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={colors.white}
                />
              }
            />
          )}

          {isSuccessStep && (
            <AuthButton
              label="Se connecter"
              onPress={handleLogin}
              variant="primary"
              fullWidth
              size="lg"
              icon={
                <Ionicons
                  name="log-in-outline"
                  size={18}
                  color={colors.white}
                />
              }
            />
          )}
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
    flex: 1,
    marginTop: 30,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
  },
  content: {
    marginTop: 16,
  },

  // Form
  form: {
    gap: 20,
  },
  fieldWrapper: {
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  required: {
    color: colors.error || "#E53935",
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
    lineHeight: 16,
    marginTop: 2,
  },

  // Resend
  resendButton: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  resendText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
  },
  resendLink: {
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  resendLinkDisabled: {
    color: colors.inkLight,
    opacity: 0.5,
  },

  // Success
  success: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successText: {
    alignItems: "center",
    gap: 8,
  },
  successTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
    textAlign: "center",
  },
  successSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 22,
  },

  // Actions
  actions: {
    marginTop: 24,
  },

  // Footer
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  backToLogin: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});
