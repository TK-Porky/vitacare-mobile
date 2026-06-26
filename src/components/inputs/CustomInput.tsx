import { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { colors } from '../../themes';
import { fontFamily, fontSize } from '../../themes';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
};

export function CustomInput({
  label,
  error,
  hint,
  leftIcon,
  style,
  ...props
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.container,
        focused && styles.containerFocused,
        !!error && styles.containerError,
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithIcon : null, style]}
          placeholderTextColor={colors.inkMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  containerFocused: {
    borderBottomColor: colors.primary,
  },
  containerError: {
    borderBottomColor: colors.error,
  },
  iconLeft: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    paddingVertical: 10,
  },
  inputWithIcon: {
    paddingLeft: 4,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.error,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
});