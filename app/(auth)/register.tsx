import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Keyboard,
  KeyboardEvent,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { HelperText, NameInput } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthButton } from "@/components/auth/AuthButton";
import { colors, fontFamily, fontSize } from "@/themes";
import { useAuth } from "@/hooks";
import { useAuthStore } from "@/store";
import { RegisterModeToggle } from "@/components/auth/register/RegisterModeToggle";
import { RegisterContactField } from "@/components/auth/register/RegisterContactField";
import { RegisterPasswordFields } from "@/components/auth/register/RegisterPasswordFields";
import {
  validateRegisterForm,
  RegisterMode,
  ValidationErrors,
} from "@/utils/register-validation";

export default function RegisterScreen() {
  // ── States ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<RegisterMode>("email");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode] = useState("+237");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localErrors, setLocalErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Hauteur du clavier actuellement visible, ajoutée dynamiquement au
  // paddingBottom du ScrollView. Sans ça, le ScrollView ignore la place
  // que prend le clavier et il devient impossible de scroller assez bas
  // pour faire apparaître les champs/boutons cachés derrière.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // ── Hooks ──────────────────────────────────────────────────────────────
  const { register, isRegistering } = useAuth();
  const storeError = useAuthStore((state) => state.error);
  const clearStoreError = useAuthStore((state) => state.clearError);

  // ── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    clearStoreError();
  }, []);

  useEffect(() => {
    // iOS déclenche "Will" un peu avant l'animation, ce qui donne un rendu
    // plus fluide. Android n'a que "Did".
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Callbacks ──────────────────────────────────────────────────────────

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

  const formatPhone = useCallback((countryCode: string, phone: string) => {
    return countryCode + phone.replace(/\s/g, "");
  }, []);

  const handleSubmit = useCallback(async () => {
    const formData = {
      fullName,
      mode,
      phone,
      email,
      password,
      confirmPassword,
    };

    const errors = validateRegisterForm(formData);
    setLocalErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);
    clearStoreError();

    try {
      await register({
        data: {
          fullName,
          mode,
          phone: mode === "phone" ? formatPhone(countryCode, phone) : undefined,
          email: mode === "email" ? email : undefined,
          password: mode === "email" ? password : undefined,
          confirmPassword: mode === "email" ? confirmPassword : undefined,
        },
      });
    } catch (error: any) {
      if (error?.code === "auth/too-many-requests") {
        Alert.alert(
          "Trop de tentatives",
          "Veuillez patienter quelques minutes avant de réessayer.",
        );
      } else if (error?.message?.includes("reCAPTCHA")) {
        Alert.alert(
          "Vérification de sécurité",
          "Une vérification de sécurité est nécessaire. Veuillez réessayer.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    fullName,
    mode,
    phone,
    email,
    password,
    confirmPassword,
    countryCode,
    register,
    clearStoreError,
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

  const isEmailMode = mode === "email";

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          // ✅ On ajoute la hauteur du clavier par-dessus le padding de base,
          // ce qui garantit qu'on peut toujours scroller jusqu'à voir le
          // dernier champ / bouton juste au-dessus du clavier.
          {
            paddingBottom: styles.scrollContent.paddingBottom + keyboardHeight,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <AuthHeader
          title="Créer un compte"
          subtitle="Rejoignez VitaCare et prenez soin de votre santé"
          showBack
          onBack={handleBack}
        />

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

          {/* Contact field */}
          <RegisterContactField
            mode={mode}
            phone={phone}
            email={email}
            countryCode={countryCode}
            onPhoneChange={(text) => {
              setPhone(text);
              clearError("contact");
            }}
            onEmailChange={(text) => {
              setEmail(text);
              clearError("contact");
            }}
            error={localErrors.contact}
          />

          {/* Password fields (email mode only) */}
          {isEmailMode && (
            <RegisterPasswordFields
              password={password}
              confirmPassword={confirmPassword}
              onPasswordChange={(text) => {
                setPassword(text);
                clearError("password");
              }}
              onConfirmPasswordChange={(text) => {
                setConfirmPassword(text);
                clearError("confirmPassword");
              }}
              passwordError={localErrors.password}
              confirmPasswordError={localErrors.confirmPassword}
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <AuthButton
            label={isEmailMode ? "Créer mon compte" : "Continuer"}
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            loading={isRegistering || isSubmitting}
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
          {storeError && (
            <HelperText message={storeError as string} type="error" />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Vous avez déjà un compte ?{" "}
            <Text style={styles.legalLink} onPress={handleLogin}>
              Se connecter
            </Text>
          </Text>
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
    </View>
  );
}

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
  actions: {
    marginTop: 24,
    gap: 12,
  },
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
