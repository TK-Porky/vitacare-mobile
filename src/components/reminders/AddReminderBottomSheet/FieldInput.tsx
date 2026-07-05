import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors, fontFamily, fontSize } from "../../../themes";

type FieldInputProps = {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  style?: object;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
};

export const FieldInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  style,
  required,
  multiline,
  numberOfLines,
}: FieldInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={style}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          multiline && styles.inputMultiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines || 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginBottom: 6,
  },
  required: {
    color: colors.error || "#E53935",
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 12,
  },
});
