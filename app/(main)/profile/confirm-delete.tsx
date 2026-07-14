import React, { useState, useCallback } from "react";
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
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { colors, fontFamily, fontSize } from "@/themes";
import {
  TopBar,
  PasswordInput,
  PrimaryButton,
  HelperText,
} from "@/components";
import { useAuthStore } from "@/store";
import { profileService } from "@/services/profile.service";

export default function ConfirmDeleteScreen() {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);

  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(async () => {
    if (!password) {
      setError(t("validation.passwordRequired"));
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await profileService.deleteAccount({
        password,
        confirmDeletion: true,
      });
      await logout();
    } catch (err: any) {
      const message = err?.message || t("errors.generic");
      setError(message);
      Alert.alert(t("common.error"), message);
    } finally {
      setIsDeleting(false);
    }
  }, [password, logout, t]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <TopBar title={t("profile.deleteAccount")} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>
              {t("profile.deleteAccount")}
            </Text>
            <Text style={styles.warningText}>
              {t("profile.confirmDeleteScreen.description")}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t("profile.confirmDeleteScreen.passwordLabel")}
            </Text>
            <PasswordInput
              placeholder={t("profile.confirmDeleteScreen.passwordPlaceholder")}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              error={!!error}
            />
            {error && <HelperText message={error} type="error" />}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={t("profile.confirmDeleteScreen.confirmButton")}
            fullWidth
            isLoading={isDeleting}
            onPress={handleDelete}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  warning: {
    backgroundColor: colors.error + "10",
    borderWidth: 1,
    borderColor: colors.error + "30",
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  warningTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.error,
    marginBottom: 8,
  },
  warningText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    lineHeight: 22,
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
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
});
