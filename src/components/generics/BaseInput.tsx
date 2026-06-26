import { useState, ReactNode } from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, fontFamily, fontSize } from '../../themes';

export type BaseInputProps = TextInputProps & {
  /** Slot gauche : icône, indicatif pays, etc. */
  leftSlot?: ReactNode;
  /** Slot droit : bouton show/hide, action, etc. */
  rightSlot?: ReactNode;
  /** Affiche la bordure en rouge */
  error?: boolean;
  countryCode?: string;
  onCountryPress?: () => void;
};

/**
 * Composant de base pour tous les champs de saisie de l'app.
 * Gère uniquement le style de conteneur et l'état de focus.
 * Les variantes métier (Phone, Email…) y ajoutent leurs slots et props.
 */
export function BaseInput({
  leftSlot,
  rightSlot,
  error = false,
  style,
  onFocus,
  onBlur,
  countryCode,
  onCountryPress,
  ...textInputProps
}: BaseInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        focused && styles.focused,
        error && styles.error,
      ]}
    >
      {leftSlot}

      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.inkMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...textInputProps}
      />

      {rightSlot}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: colors.surface,
  },
  focused: {
    borderColor: colors.ink,
  },
  error: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.ink,
    padding: 0,
  },
});