import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import {
  PhoneInput,
  TopBar,
  HelperText,
  PrimaryButton,
} from "../../src/components";
import { isValidCMPhone } from "@vitacare/utils";
import { colors, fontFamily, fontSize } from "../../src/themes";

import { useAuth } from "../../src/hooks/useAuth";
import { useAuthStore } from "../../src/store";
import { firebaseAuth } from "../../src/lib/firebase";

// ================================================================================== //
// Main
// ================================================================================== //
export default function LoginPhoneScreen() {
  // ================================================================================== //
  // States
  // ================================================================================== //
  const [phone, setPhone] = useState(""); // Phone input
  const [localError, setLocalError] = useState(""); // Local validation error

  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const { loginPhone, isLoggingInPhone } = useAuth(); // Auth hook
  const storeError = useAuthStore((state) => state.error); // Store error
  const clearStoreError = useAuthStore((state) => state.clearError); // Clear store error

  // ================================================================================== //
  // Effects
  // ================================================================================== //
  useEffect(() => {
    clearStoreError();
  }, []);

  // ================================================================================== //
  // Functions
  // ================================================================================== //

  /**
   * Handle form submission
   * @returns
   */
  const handleSubmit = async () => {
    if (!isValidCMPhone(phone)) {
      setLocalError("Numéro de téléphone invalide.");
      return;
    }
    setLocalError("");
    clearStoreError();

    loginPhone({
      phone,
    });
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
        <Text style={styles.title}>Connexion par Téléphone</Text>
        <Text style={styles.subtitle}>
          Entrez votre numéro pour recevoir le code de confirmation.
        </Text>

        <View style={styles.inputWrapper}>
          <PhoneInput
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (localError) setLocalError("");
              if (storeError) clearStoreError();
            }}
            error={!!localError || !!storeError}
          />
          {localError || storeError ? (
            <HelperText
              message={localError || (storeError as string)}
              type="error"
            />
          ) : (
            <HelperText
              message="En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité."
              type="info"
            />
          )}
        </View>

        <PrimaryButton
          label="Recevoir le code par SMS"
          fullWidth
          isLoading={isLoggingInPhone}
          loadingText="Envoi en cours..."
          onPress={handleSubmit}
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
    display: "flex",
    flexDirection: "column",
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
  inputWrapper: {
    gap: 8,
  },
});
