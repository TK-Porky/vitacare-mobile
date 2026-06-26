import { useState, useEffect } from "react";
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
import {
  TopBar,
  PasswordInput,
  PrimaryButton,
  HelperText,
  OTPInput,
  EmailInput,
} from "../../src/components";
import { colors, fontFamily, fontSize } from "../../src/themes";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/hooks/useAuth";
import { useAuthStore } from "../../src/store";

// ================================================================================== //
// Types
// ================================================================================== //
type Step = "email" | "otp" | "reset" | "success";

const STEP_INDEX: Record<Step, number> = {
  email: 0,
  otp: 1,
  reset: 2,
  success: 2,
};

// ================================================================================== //
// Components
// ================================================================================== //

/**
 * Step dots component
 * @param step - Current step
 * @returns 
 */
function StepDots({ step }: { step: Step }) {
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

/**
 * Dots component
 * @returns 
 */
const dots = StyleSheet.create({
  row: { flexDirection: "row", gap: 5 },
  dot: { width: "33%", height: 4, borderRadius: 2 },
  dotActive: { backgroundColor: colors.primary },
  dotInactive: { backgroundColor: colors.border },
});

/**
 * Password strength component
 * @param password - Password to check
 * @returns 
 */
function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ["", "Faible", "Moyen", "Fort", "Très fort"];
  const segColors = [
    colors.error,
    colors.warning,
    colors.primary,
    colors.primary,
  ];

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
                backgroundColor:
                  i <= score ? segColors[score - 1] : colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[strength.label, { color: segColors[score - 1] }]}>
        {labels[score]}
      </Text>
    </View>
  );
}

// ================================================================================== //
// Styles
// ================================================================================== //
const strength = StyleSheet.create({
  wrapper: { gap: 4 },
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
  const [step, setStep] = useState<Step>("email"); // Current step
  const [email, setEmail] = useState(""); // Email input
  const [otp, setOtp] = useState(""); // OTP input
  const [password, setPassword] = useState(""); // Password input
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirm password input
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({}); // Local errors

  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const { 
    forgotPassword, isSendingReset, 
    verifyPasswordResetOtp, isVerifyingResetOtp,
    resetPassword, isResettingPassword
  } = useAuth();
  const storeError = useAuthStore(state => state.error);
  const clearStoreError = useAuthStore(state => state.clearError);

  // ================================================================================== //
  // Effects
  // ================================================================================== //
  useEffect(() => {
    clearStoreError();
  }, [step]);

  // ================================================================================== //
  // Functions
  // ================================================================================== //
  /**
   * Clear local and store errors
   * @param key - Error key to clear
   */
  const clearError = (key: string) => {
    setLocalErrors((e) => ({ ...e, [key]: "" }));
    if (storeError) clearStoreError();
  };

  /**
   * Handle back button
   * @returns 
   */
  const handleBack = () => {
    const prev: Partial<Record<Step, Step>> = {
      otp: "email",
      reset: "otp",
    };
    const previous = prev[step];
    if (previous) setStep(previous);
    else router.back();
  };

  /**
   * Handle email submit
   * @returns 
   */
  const handleEmailSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Adresse email invalide.";
    }
    setLocalErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await forgotPassword(email);
      setStep("otp");
    } catch {
      // Error handled by storeError
    }
  };

  /**
   * Handle OTP submit
   * @returns 
   */
  const handleOtpSubmit = async () => {
    if (otp.length < 6) {
      setLocalErrors({ otp: "Veuillez entrer le code complet." });
      return;
    }
    setLocalErrors({});
    
    try {
      await verifyPasswordResetOtp({ email, otp });
      setStep("reset");
    } catch {
      // Error handled by storeError
    }
  };

  /**
   * Handle reset submit
   * @returns 
   */
  const handleResetSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (password.length < 8 || password.includes(" ")) {
      newErrors.password = "Minimum 8 caractères, sans espace.";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }
    setLocalErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await resetPassword({ email, password });
      setStep("success");
    } catch {
      // Error handled by storeError
    }
  };

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TopBar onBack={handleBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Étape 1 : Email ── */}
        {step === "email" && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Mot de passe oublié</Text>
              <Text style={styles.subtitle}>
                Entrez l'adresse email associée à votre compte VitaCare
              </Text>
            </View>
            <View style={styles.form}>
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Adresse email</Text>
                <EmailInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError("email");
                  }}
                  error={!!localErrors.email || !!storeError}
                />
                {localErrors.email || storeError ? (
                  <HelperText message={localErrors.email || (storeError as string)} type="error" />
                ) : (
                  <HelperText
                    message="Un code de vérification sera envoyé à cette adresse"
                    type="info"
                  />
                )}
              </View>
            </View>
            <PrimaryButton
              label="Envoyer le code"
              fullWidth
              isLoading={isSendingReset}
              onPress={handleEmailSubmit}
            />
          </>
        )}

        {/* ── Étape 2 : OTP ── */}
        {step === "otp" && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Vérification</Text>
              <Text style={styles.subtitle}>
                Veuillez consulter votre boite mail et entrer le code envoyé à{" "}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>
            <View style={styles.form}>
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Code à 6 chiffres</Text>
                <OTPInput
                  length={6}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    clearError("otp");
                  }}
                  error={!!localErrors.otp || !!storeError}
                />
                {localErrors.otp || storeError ? (
                  <HelperText message={localErrors.otp || (storeError as string)} type="error" />
                ) : null}
              </View>
              <Text style={styles.resend}>
                Pas reçu ?{" "}
                <TouchableOpacity onPress={handleEmailSubmit} disabled={isSendingReset}>
                  <Text style={styles.resendLink}>Renvoyer le code</Text>
                </TouchableOpacity>
              </Text>
            </View>
            <PrimaryButton
              label="Vérifier"
              fullWidth
              isLoading={isVerifyingResetOtp}
              onPress={handleOtpSubmit}
            />
          </>
        )}

        {/* ── Étape 3 : Nouveau mot de passe ── */}
        {step === "reset" && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Nouveau mot de passe</Text>
              <Text style={styles.subtitle}>
                Choisissez un mot de passe sécurisé pour votre compte
              </Text>
            </View>
            <View style={styles.form}>
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <PasswordInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError("password");
                  }}
                  error={!!localErrors.password}
                />
                <PasswordStrength password={password} />
                {localErrors.password && (
                  <HelperText message={localErrors.password} type="error" />
                )}
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <PasswordInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearError("confirmPassword");
                  }}
                  error={!!localErrors.confirmPassword}
                />
                {localErrors.confirmPassword && (
                  <HelperText message={localErrors.confirmPassword} type="error" />
                )}
              </View>
              {storeError && (
                <HelperText message={storeError as string} type="error" />
              )}
            </View>
            <PrimaryButton
              label="Réinitialiser"
              fullWidth
              isLoading={isResettingPassword}
              onPress={handleResetSubmit}
            />
          </>
        )}

        {/* ── Succès ── */}
        {step === "success" && (
          <View style={styles.success}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={48} color={colors.white} />
            </View>
            <View style={styles.header}>
              <Text style={[styles.title, { textAlign: "center" }]}>
                Mot de passe modifié !
              </Text>
              <Text style={[styles.subtitle, { textAlign: "center" }]}>
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez
                maintenant vous connecter.
              </Text>
            </View>
            <PrimaryButton
              label="Se connecter"
              fullWidth
              onPress={() => router.replace("/(auth)/login-email")}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexGrow: 1, backgroundColor: colors.white },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 32,
  },
  header: { gap: 4 },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    lineHeight: 22,
  },
  emailHighlight: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  form: { gap: 24 },
  fieldWrapper: { gap: 6 },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  resend: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    textAlign: "center",
  },
  resendLink: {
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  success: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 32,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconText: {
    fontSize: 28,
    color: colors.primary,
  },
});
