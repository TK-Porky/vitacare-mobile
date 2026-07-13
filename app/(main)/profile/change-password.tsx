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
import { useTranslation } from "react-i18next";
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
  getChangePasswordSchema,
  ChangePasswordInput,
} from "../../../src/schemas";

export default function ChangePasswordScreen() {
  const { t } = useTranslation();

  const { changePassword, isChangingPassword, error, clearState, success } =
    useProfile();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(getChangePasswordSchema(t)),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (success) {
      Alert.alert(t("common.success"), t("profile.changePasswordScreen.success"));
      clearState();
      router.back();
    }
  }, [success, clearState, t]);

  const onUpdate = async (data: ChangePasswordInput) => {
    await changePassword(data);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <TopBar title={t("profile.changePasswordScreen.title")} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t("profile.changePasswordScreen.securityTitle")}</Text>
            <Text style={styles.subtitle}>
              {t("profile.changePasswordScreen.securitySubtitle")}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("profile.changePasswordScreen.currentPassword")}</Text>
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    placeholder={t("profile.changePasswordScreen.currentPasswordPlaceholder")}
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
              <Text style={styles.label}>{t("profile.changePasswordScreen.newPassword")}</Text>
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    placeholder={t("profile.changePasswordScreen.newPasswordPlaceholder")}
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
                {t("profile.changePasswordScreen.confirmPassword")}
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    placeholder={t("profile.changePasswordScreen.confirmPasswordPlaceholder")}
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
              label={t("profile.changePasswordScreen.change")}
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
