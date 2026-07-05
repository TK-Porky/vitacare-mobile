// app/(auth)/login-email.tsx
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
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PasswordInput, HelperText, EmailInput } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthButton } from "@/components/auth/AuthButton";
import { colors, fontFamily, fontSize } from "@/themes";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store";

// ================================================================================== //
// Main
// ================================================================================== //
export default function LoginEmailScreen() {
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
      setLocalError("Adresse email invalide.");
      return false;
    }
    if (password.length < 8) {
      setLocalError("Le mot de passe doit contenir au moins 8 caractères.");
      return false;
    }
    return true;
  }, [email, password]);

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Header ── */}
        <AuthHeader
          title="Connexion par Email"
          subtitle="Entrez votre email et mot de passe pour vous connecter"
          showBack
          onBack={handleBack}
        />

        {/* ── Form ── */}
        <View style={styles.form}>
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <EmailInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (localError) setLocalError("");
                if (storeError) clearStoreError();
              }}
              placeholder="exemple@email.com"
              autoFocus
            />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>
              Mot de passe <Text style={styles.required}>*</Text>
            </Text>
            <PasswordInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (localError) setLocalError("");
                if (storeError) clearStoreError();
              }}
              placeholder="Mot de passe"
            />
          </View>

          <View style={styles.rememberRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleForgotPassword}
              accessibilityLabel="Mot de passe oublié"
              accessibilityRole="button"
            >
              <Text style={styles.forgotText}>Mot de passe oublié</Text>
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
            label="Se connecter"
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
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ✅ Google Sign-In avec Firebase */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              isLoading && styles.googleButtonDisabled,
            ]}
            onPress={handleGoogleLogin}
            activeOpacity={0.7}
            disabled={isLoading}
            accessibilityLabel="Se connecter avec Google"
            accessibilityRole="button"
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#f44242ff" />
                <Text style={styles.googleText}>Continuer avec Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Vous n'avez pas de compte ?{" "}
            <Text style={styles.legalLink} onPress={handleSignUp}>
              S'inscrire
            </Text>
          </Text>

          {/* Légal */}
          <Text style={styles.legal}>
            En continuant, vous acceptez nos{" "}
            <Text style={styles.legalLink} onPress={handleTerms}>
              Conditions d'utilisation
            </Text>{" "}
            et notre{" "}
            <Text style={styles.legalLink} onPress={handlePrivacy}>
              Politique de confidentialité
            </Text>
            .
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
