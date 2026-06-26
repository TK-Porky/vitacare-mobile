// app/(auth)/register.tsx
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  TopBar,
  PasswordInput,
  PrimaryButton,
  HelperText,
  PhoneInput,
  NameInput,
  EmailInput,
} from "../../src/components";
import { colors, fontFamily, fontSize } from "../../src/themes";
import { isValidCMPhone } from "@vitacare/utils";
import { useAuth } from "../../src/hooks/useAuth";
import { useAuthStore } from "../../src/store";
import { firebaseAuth } from "../../src/lib/firebase";

// ================================================================================== //
// Types
// ================================================================================== //
type RegisterMode = "phone" | "email";

// ================================================================================== //
// Main
// ================================================================================== //
export default function RegisterScreen() {
  // ================================================================================== //
  // States
  // ================================================================================== //
  const [mode, setMode] = useState<RegisterMode>("phone"); // Registration mode: phone or email
  const [fullName, setFullName] = useState(""); // User's full name
  const [phone, setPhone] = useState(""); // User's phone number
  const [email, setEmail] = useState(""); // User's email address
  const [password, setPassword] = useState(""); // User's password
  const [confirmPassword, setConfirmPassword] = useState(""); // User's confirm password
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({}); // Local validation errors

  // ================================================================================== //
  // Refs
  // ================================================================================== //
  const { register, isRegistering } = useAuth();
  const storeError = useAuthStore((state) => state.error);
  const clearStoreError = useAuthStore((state) => state.clearError);

  // ================================================================================== //
  // Effecs
  // ================================================================================== //
  useEffect(() => {
    clearStoreError();
  }, []);

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
   * Handle mode change
   * @param next - Next mode
   */
  const handleModeChange = (next: RegisterMode) => {
    setMode(next);
    setPhone("");
    setEmail("");
    setLocalErrors({});
    clearStoreError();
  };

  /**
   * Validate form
   * @returns True if valid, false otherwise
   */
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Le nom complet est requis.";
    }

    if (mode === "phone") {
      if (!isValidCMPhone(phone)) {
        newErrors.contact = "Numéro de téléphone invalide.";
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.contact = "Adresse email invalide.";
      }

      if (password.length < 8 || password.includes(" ")) {
        newErrors.password = "Minimum 8 caractères, sans espace.";
      }

      if (password !== confirmPassword || confirmPassword.includes(" ")) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
      }
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * @returns
   */
  const handleSubmit = async () => {
    if (!validate()) return;
    clearStoreError();

    register({
      data: {
        fullName,
        mode,
        phone: mode === "phone" ? phone : undefined,
        email: mode === "email" ? email : undefined,
        password: mode === "email" ? password : undefined,
        confirmPassword: mode === "email" ? confirmPassword : undefined,
      },
    });
  };

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <View style={styles.root}>
      <TopBar />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Rejoignez notre service !</Text>
            <Text style={styles.subtitle}>
              Créez votre profil dès maintenant
            </Text>
          </View>

          <View style={styles.form}>
            {/* Nom complet */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Nom complet</Text>
              <NameInput
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  clearError("fullName");
                }}
                placeholder="Ex: Jean Ateba Mbarga"
                error={!!localErrors.fullName}
              />
              {localErrors.fullName && (
                <HelperText message={localErrors.fullName} type="error" />
              )}
            </View>

            {/* Toggle mode */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Mode d'inscription</Text>
              <View style={styles.toggle}>
                {(["phone", "email"] as RegisterMode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.toggleBtn,
                      mode === m && styles.toggleBtnActive,
                    ]}
                    onPress={() => handleModeChange(m)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.toggleLabel,
                        mode === m && styles.toggleLabelActive,
                      ]}
                    >
                      {m === "phone" ? "Téléphone" : "Email"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Champ dynamique : téléphone ou email */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>
                {mode === "phone" ? "Numéro de téléphone" : "Adresse email"}
              </Text>
              {mode === "phone" ? (
                <View style={styles.fieldWrapper}>
                  <PhoneInput
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      clearError("contact");
                    }}
                    error={!!localErrors.contact}
                  />
                  {localErrors.contact && (
                    <HelperText message={localErrors.contact} type="error" />
                  )}
                </View>
              ) : (
                <>
                  <View style={styles.fieldWrapper}>
                    <EmailInput
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        clearError("contact");
                      }}
                      error={!!localErrors.contact}
                    />
                    {localErrors.contact && (
                      <HelperText message={localErrors.contact} type="error" />
                    )}
                  </View>

                  {/* Mot de passe */}
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Mot de passe</Text>
                    <PasswordInput
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        clearError("password");
                      }}
                      error={!!localErrors.password}
                    />
                    {localErrors.password && (
                      <HelperText message={localErrors.password} type="error" />
                    )}
                  </View>

                  {/* Confirmation */}
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
                      <HelperText
                        message={localErrors.confirmPassword}
                        type="error"
                      />
                    )}
                  </View>
                </>
              )}
            </View>

            {storeError && (
              <HelperText message={storeError as string} type="error" />
            )}
          </View>

          <View style={styles.footer}>
            <PrimaryButton
              label="Continuer"
              fullWidth
              isLoading={isRegistering}
              onPress={handleSubmit}
            />
            <Text style={styles.terms}>
              En continuant, vous acceptez nos{" "}
              <Text style={styles.link}>conditions d'utilisation</Text> et notre{" "}
              <Text style={styles.link}>politique de confidentialité</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48, // Added more bottom padding for better visibility
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
  },
  form: { gap: 24 },
  fieldWrapper: { gap: 6 },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  // Toggle
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  toggleLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  toggleLabelActive: {
    color: colors.ink,
  },
  // Footer
  footer: { gap: 16 },
  terms: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 18,
  },
  link: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
});
