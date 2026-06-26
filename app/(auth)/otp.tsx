import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { OTPInput, TopBar, HelperText, PrimaryButton } from "../../src/components";
import { colors, fontFamily, fontSize } from "../../src/themes";
import { useAuth } from "../../src/hooks/useAuth";
import { useAuthStore } from "../../src/store";

// ================================================================================== //
// Types
// ================================================================================== //
const OTP_LENGTH = 6;
const RESEND_DELAY = 60;

// ================================================================================== //
// Main
// ================================================================================== //
export default function OTPScreen() {
  // ================================================================================== //
  // States
  // ================================================================================== //
  const { phone, fullName } = useLocalSearchParams<{ phone: string; fullName: string }>();
  const [code, setCode] = useState(""); // OTP code input
  const [localError, setLocalError] = useState(""); // Local validation error
  const [countdown, setCountdown] = useState(RESEND_DELAY); // Resend countdown timer

  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const { verifyOtp, isVerifyingOtp } = useAuth(); // Authentication hook
  const storeError = useAuthStore(state => state.error); // Store error state
  const clearStoreError = useAuthStore(state => state.clearError); // Clear store error

  // ================================================================================== //
  // Effects
  // ================================================================================== //
  
  // Clear store error on component mount
  useEffect(() => {
    clearStoreError();
  }, []);

  // Handle countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ================================================================================== //
  // Functions
  // ================================================================================== //
  /**
   * Handle OTP verification
   * @param otpCode - The OTP code to verify
   */
  const handleVerify = useCallback(async (otpCode: string) => {
    if (otpCode.length !== OTP_LENGTH) return;

    setLocalError("");
    clearStoreError();

    verifyOtp({ 
      phone: phone || "",
      code: otpCode,
      fullName: fullName // Pass fullName if it exists (registration case)
    });
  }, [phone, fullName, verifyOtp, clearStoreError]);

  /**
   * Handle resend OTP
   * @returns
   */
  const handleResend = async () => {
    if (countdown > 0 || !phone) return;
    
    setCountdown(RESEND_DELAY);
    setCode("");
    setLocalError("");
    clearStoreError();

    Alert.alert("Code renvoyé", "Un nouveau code a été envoyé au " + phone);
  };

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TopBar />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Code de confirmation</Text>
        <Text style={styles.subtitle}>
          Entrez le code envoyé par SMS au{" "}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        <View style={styles.otpWrapper}>
          <OTPInput
            length={OTP_LENGTH}
            value={code}
            onChange={setCode}
            onComplete={handleVerify}
            error={!!localError || !!storeError}
          />

          <View style={styles.helperRow}>
            {localError || storeError ? (
              <HelperText message={localError || (storeError as string)} type="error" />
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <TouchableOpacity
              onPress={handleResend}
              disabled={countdown > 0}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.resend, countdown > 0 && styles.resendDisabled]}
              >
                {countdown > 0 ? `Renvoyer (${countdown}s)` : "Renvoyer"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <PrimaryButton
          label="Confirmer"
          fullWidth
          isLoading={isVerifyingOtp}
          isDisabled={code.length !== OTP_LENGTH}
          onPress={() => handleVerify(code)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 24,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.inkMuted,
    lineHeight: 20,
    marginTop: -12,
  },
  phone: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  otpWrapper: {
    gap: 12,
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  resend: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.ink,
  },
  resendDisabled: {
    opacity: 0.35,
  },
});
