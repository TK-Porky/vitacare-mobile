import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PasswordInput, HelperText } from "@/components";
import { colors, fontFamily, fontSize } from "@/themes";

type RegisterPasswordFieldsProps = {
  password: string;
  confirmPassword: string;
  onPasswordChange: (text: string) => void;
  onConfirmPasswordChange: (text: string) => void;
  passwordError?: string;
  confirmPasswordError?: string;
};

export const RegisterPasswordFields = ({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  passwordError,
  confirmPasswordError,
}: RegisterPasswordFieldsProps) => {
  return (
    <>
      <View style={styles.fieldWrapper}>
        <Text style={styles.label}>
          Mot de passe <Text style={styles.required}>*</Text>
        </Text>
        <PasswordInput
          value={password}
          onChangeText={onPasswordChange}
          placeholder="Minimum 8 caractères"
          error={!!passwordError}
        />
        {passwordError && <HelperText message={passwordError} type="error" />}
        <Text style={styles.hint}>
          • Minimum 8 caractères
          {"\n"}• Sans espaces
        </Text>
      </View>

      <View style={styles.fieldWrapper}>
        <Text style={styles.label}>
          Confirmer le mot de passe <Text style={styles.required}>*</Text>
        </Text>
        <PasswordInput
          value={confirmPassword}
          onChangeText={onConfirmPasswordChange}
          placeholder="Confirmez votre mot de passe"
          error={!!confirmPasswordError}
        />
        {confirmPasswordError && (
          <HelperText message={confirmPasswordError} type="error" />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  fieldWrapper: { gap: 6 },
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
});
