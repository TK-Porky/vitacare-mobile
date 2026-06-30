// app/(auth)/login-phone.tsx
import { useState, useRef, useEffect, useCallback } from "react";
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
import { PhoneInput, HelperText, PrimaryButton } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthButton } from "@/components/auth/AuthButton";
import { isValidCMPhone } from "@/utils";
import { colors, fontFamily, fontSize } from "@/themes";
import { useAuth } from "@/hooks";
import { useAuthStore } from "@/store";

// ================================================================================== //
// Main
// ================================================================================== //
export default function LoginPhoneScreen() {
  // ================================================================================== //
  // States
  // ================================================================================== //
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const { loginPhone, isLoggingInPhone } = useAuth();
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

  const handleSubmit = useCallback(async () => {
    if (!isValidCMPhone(phone)) {
      setLocalError("Numéro de téléphone invalide.");
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    setLocalError("");
    clearStoreError();

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    loginPhone({ phone });
  }, [phone, clearStoreError, loginPhone]);

  const handleBack = useCallback(() => {
    router.back();
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

  const errorMessage = localError || storeError;

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
          title="Connexion par Téléphone"
          subtitle="Entrez votre numéro pour recevoir le code de confirmation"
          showBack
          onBack={handleBack}
        />

        {/* ── Form ── */}
        <View style={styles.form}>
          <View style={styles.phoneWrapper}>
            <PhoneInput
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (localError) setLocalError("");
                if (storeError) clearStoreError();
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              error={!!errorMessage}
              placeholder="6 XX XX XX XX"
              autoFocus
            />
          </View>

          {errorMessage ? (
            <HelperText message={errorMessage as string} type="error" />
          ) : (
            <HelperText
              message="Un code de confirmation vous sera envoyé par SMS"
              type="info"
            />
          )}
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <AuthButton
            label="Recevoir le code par SMS"
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            loading={isLoggingInPhone}
            size="lg"
            icon={
              <Ionicons name="send-outline" size={18} color={colors.white} />
            }
          />
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
    gap: 12,
  },
  phoneWrapper: {
    marginTop: 4,
  },

  // Actions
  actions: {
    marginTop: 32,
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
  footerLink: {
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  legal: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    textAlign: "center",
  },
  legalLink: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
});
