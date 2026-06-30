// app/(auth)/register.tsx
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
import {
  PasswordInput,
  HelperText,
  PhoneInput,
  NameInput,
  EmailInput,
} from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthButton } from "@/components/auth/AuthButton";
import { colors, fontFamily, fontSize } from "@/themes";
import { isValidCMPhone } from "@/utils";
import { useAuth } from "@/hooks";
import { useAuthStore } from "@/store";

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
  const [mode, setMode] = useState<RegisterMode>("email");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const { register, isRegistering } = useAuth();
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

  const clearError = useCallback(
    (key: string) => {
      setLocalErrors((e) => ({ ...e, [key]: "" }));
      if (storeError) clearStoreError();
    },
    [storeError, clearStoreError],
  );

  const handleModeChange = useCallback(
    (next: RegisterMode) => {
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setMode(next);
      setPhone("");
      setEmail("");
      setLocalErrors({});
      clearStoreError();
    },
    [clearStoreError],
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Le nom complet est requis.";
    } else if (fullName.trim().split(" ").length < 2) {
      newErrors.fullName = "Veuillez entrer votre nom et prénom.";
    }

    if (mode === "phone") {
      if (!isValidCMPhone(phone)) {
        newErrors.contact = "Numéro de téléphone invalide.";
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.contact = "Adresse email invalide.";
      }

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
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, mode, phone, email, password, confirmPassword]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

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
  }, [
    validate,
    clearStoreError,
    register,
    fullName,
    mode,
    phone,
    email,
    password,
    confirmPassword,
  ]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleLogin = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(auth)/login-email");
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

  const errorMessage = storeError;
  const isEmailMode = mode === "email";

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
          title="Créer un compte"
          subtitle="Rejoignez VitaCare et prenez soin de votre santé"
          showBack
          onBack={handleBack}
        />

        {/* ── Form ── */}
        <View style={styles.form}>
          {/* Nom complet */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>
              Nom complet <Text style={styles.required}>*</Text>
            </Text>
            <NameInput
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                clearError("fullName");
              }}
              placeholder="Jean Ateba Mbarga"
              error={!!localErrors.fullName}
            />
            {localErrors.fullName && (
              <HelperText message={localErrors.fullName} type="error" />
            )}
          </View>

          {/* Mode d'inscription */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>
              Mode d'inscription <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.toggle}>
              {(["phone", "email"] as RegisterMode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.toggleBtn,
                    mode === m && styles.toggleBtnActive,
                  ]}
                  onPress={() => handleModeChange(m)}
                  activeOpacity={0.7}
                  accessibilityLabel={`S'inscrire par ${m === "phone" ? "téléphone" : "email"}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === m }}
                >
                  <Ionicons
                    name={m === "phone" ? "call-outline" : "mail-outline"}
                    size={16}
                    color={mode === m ? colors.primary : colors.inkLight}
                  />
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

          {/* Contact (Phone ou Email) */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>
              {mode === "phone" ? "Numéro de téléphone" : "Adresse email"}
              <Text style={styles.required}> *</Text>
            </Text>
            {mode === "phone" ? (
              <PhoneInput
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  clearError("contact");
                }}
                placeholder="6 XX XX XX XX"
                error={!!localErrors.contact}
              />
            ) : (
              <EmailInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError("contact");
                }}
                placeholder="exemple@email.com"
                error={!!localErrors.contact}
              />
            )}
            {localErrors.contact && (
              <HelperText message={localErrors.contact} type="error" />
            )}
          </View>

          {/* Champs Email uniquement */}
          {isEmailMode && (
            <>
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>
                  Mot de passe <Text style={styles.required}>*</Text>
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
                {localErrors.password && (
                  <HelperText message={localErrors.password} type="error" />
                )}
                <Text style={styles.hint}>
                  • Minimum 8 caractères
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
            </>
          )}
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <AuthButton
            label={isEmailMode ? "Créer mon compte" : "Continuer"}
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            loading={isRegistering}
            size="lg"
            icon={
              <Ionicons
                name={
                  isEmailMode ? "person-add-outline" : "arrow-forward-outline"
                }
                size={18}
                color={colors.white}
              />
            }
          />

          {errorMessage && (
            <HelperText message={errorMessage as string} type="error" />
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Vous avez déjà un compte ?{" "}
            <Text style={styles.legalLink} onPress={handleLogin}>
              Se connecter
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
  fieldWrapper: {
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  required: {
    color: colors.error || "#E53935",
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    lineHeight: 16,
    marginTop: 2,
  },

  // Toggle
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  toggleLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  toggleLabelActive: {
    color: colors.primary,
  },

  // Actions
  actions: {
    marginTop: 24,
    gap: 12,
  },

  // Footer
  footer: {
    marginTop: 24,
    gap: 24,
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  footerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
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
    lineHeight: 17,
  },
  legalLink: {
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
});
