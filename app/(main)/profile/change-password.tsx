import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors, fontFamily, fontSize } from "../../../src/themes";
import {
  TopBar,
  PasswordInput,
  PrimaryButton,
  HelperText,
} from "../../../src/components";
import { router } from "expo-router";
import { useProfile } from "../../../src/hooks";
import {
  changePasswordSchema,
  ChangePasswordInput,
} from "../../../src/schemas";

export default function ChangePasswordScreen() {
  // ================================================================================== //
  // Store & Hooks
  // ================================================================================== //

  const { changePassword, isChangingPassword, error, clearState, success } =
    useProfile();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // ================================================================================== //
  // Effects
  // ================================================================================== //

  useEffect(() => {
    if (success) {
      Alert.alert("Succès", "Votre mot de passe a été modifié.");
      clearState();
      router.back();
    }
  }, [success]);

  const onUpdate = async (data: ChangePasswordInput) => {
    await changePassword(data);
  };

  // ================================================================================== //
  // JSX
  // ================================================================================== //

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <TopBar title="Modifier le mot de passe" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Sécurité du compte</Text>
            <Text style={styles.subtitle}>
              Choisissez un mot de passe robuste pour protéger vos données
              médicales
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe actuel</Text>
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    placeholder="Entrez votre mot de passe actuel"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={!!errors.currentPassword}
                  />
                )}
              />
              {errors.currentPassword && (
                <HelperText
                  message={errors.currentPassword.message || ""}
                  type="error"
                />
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    placeholder="Minimum 8 caractères"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={!!errors.newPassword}
                  />
                )}
              />
              {errors.newPassword && (
                <HelperText
                  message={errors.newPassword.message || ""}
                  type="error"
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Confirmer le nouveau mot de passe
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    placeholder="Répétez le mot de passe"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={!!errors.confirmPassword}
                  />
                )}
              />
              {errors.confirmPassword && (
                <HelperText
                  message={errors.confirmPassword.message || ""}
                  type="error"
                />
              )}
            </View>

            {error && <HelperText message={error as string} type="error" />}
          </View>

          <View style={styles.footer}>
            <PrimaryButton
              label="Mettre à jour"
              fullWidth
              isLoading={isChangingPassword}
              onPress={handleSubmit(onUpdate)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  footer: {
    marginTop: 40,
  },
});
