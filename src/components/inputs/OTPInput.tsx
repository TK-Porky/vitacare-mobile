// components/OTPInput.tsx
import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
  Platform,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, fontFamily, fontSize } from "../../themes";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  error?: boolean;
  secureTextEntry?: boolean;
  hapticFeedback?: boolean;
  disabled?: boolean;
}

export function OTPInput({
  length = 5,
  value,
  onChange,
  onComplete,
  autoFocus = true,
  error = false,
  secureTextEntry = false,
  hapticFeedback = true,
  disabled = false,
}: OTPInputProps) {
  // ================================================================================== //
  // Refs
  // ================================================================================== //
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const containerRef = useRef<View>(null);
  const isFillingRef = useRef(false);
  const lastFocusedIndex = useRef<number>(0);

  // ================================================================================== //
  // States
  // ================================================================================== //
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // ================================================================================== //
  // Effects
  // ================================================================================== //

  // Auto-focus sur le premier input
  useEffect(() => {
    if (autoFocus && !disabled) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  // ================================================================================== //
  // Helpers
  // ================================================================================== //

  // Récupérer les digits
  const getDigits = useCallback(() => {
    const digits = value.split("").slice(0, length);
    while (digits.length < length) {
      digits.push("");
    }
    return digits;
  }, [value, length]);

  // Focus sur un input spécifique
  const focusInput = useCallback(
    (index: number) => {
      if (index < 0 || index >= length) return;

      const input = inputRefs.current[index];
      if (input && !disabled) {
        // Petit délai pour s'assurer que tout est prêt
        requestAnimationFrame(() => {
          input.focus();
          // Sélectionner le texte
          input.setSelection?.(0, 1);
        });
      }
    },
    [length, disabled],
  );

  // ================================================================================== //
  // Handlers
  // ================================================================================== //

  // Gestion du changement de texte
  const handleChangeText = useCallback(
    (text: string, index: number) => {
      // Si désactivé ou en cours de remplissage, ignorer
      if (disabled || isFillingRef.current) return;

      // Nettoyer le texte (garder uniquement le dernier chiffre)
      const cleaned = text.replace(/\D/g, "");
      const digit = cleaned.slice(-1);

      // Si aucun chiffre, ignorer (le Backspace gère la suppression)
      if (!digit) return;

      // Feedback haptique
      if (hapticFeedback && Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Créer la nouvelle valeur
      const currentDigits = value.split("").slice(0, length);
      while (currentDigits.length < length) {
        currentDigits.push("");
      }
      currentDigits[index] = digit;
      const newValue = currentDigits.join("");

      // Mettre à jour la valeur
      onChange(newValue);

      // Passer à la case suivante si disponible
      if (index < length - 1) {
        lastFocusedIndex.current = index + 1;
        focusInput(index + 1);
      } else {
        lastFocusedIndex.current = index;
      }

      // Vérifier si le code est complet
      if (newValue.length === length && onComplete) {
        isFillingRef.current = true;
        onComplete(newValue);
        setTimeout(() => {
          isFillingRef.current = false;
        }, 500);
      }
    },
    [value, length, onChange, onComplete, focusInput, hapticFeedback, disabled],
  );

  // Gestion des touches clavier
  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      const key = e.nativeEvent.key;
      const currentDigits = value.split("").slice(0, length);
      while (currentDigits.length < length) {
        currentDigits.push("");
      }

      // Si c'est la touche Backspace
      if (key === "Backspace") {
        // Si la case actuelle est vide et qu'on n'est pas à la première
        if (index > 0 && !currentDigits[index]) {
          // Supprimer le contenu de la case précédente
          const newDigits = [...currentDigits];
          newDigits[index - 1] = "";
          onChange(newDigits.join(""));

          // Focus sur la case précédente
          lastFocusedIndex.current = index - 1;
          focusInput(index - 1);
        }
        // Si la case actuelle contient un chiffre, on le supprime
        else if (currentDigits[index]) {
          const newDigits = [...currentDigits];
          newDigits[index] = "";
          onChange(newDigits.join(""));
        }
      }
    },
    [value, length, onChange, focusInput],
  );

  // Gestion du focus
  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
    lastFocusedIndex.current = index;
  }, []);

  // Gestion de la perte de focus
  const handleBlur = useCallback(() => {
    setFocusedIndex(null);
  }, []);

  // Gestion du clic sur une case
  const handlePress = useCallback(
    (index: number) => {
      if (disabled) return;

      const currentDigits = value.split("").slice(0, length);
      while (currentDigits.length < length) {
        currentDigits.push("");
      }

      // Si la case est vide, on y va directement
      if (!currentDigits[index]) {
        focusInput(index);
        return;
      }

      // Sinon, on cherche la première case vide à partir de l'index
      let targetIndex = index;
      for (let i = index; i < length; i++) {
        if (!currentDigits[i]) {
          targetIndex = i;
          break;
        }
      }

      // Si toutes les cases sont remplies, on reste sur la dernière
      if (targetIndex === index && currentDigits[index]) {
        targetIndex = length - 1;
      }

      focusInput(targetIndex);
    },
    [value, length, focusInput, disabled],
  );

  // ================================================================================== //
  // Render
  // ================================================================================== //

  const digits = getDigits();

  return (
    <View ref={containerRef} style={styles.container}>
      {digits.map((digit, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={1}
          onPress={() => handlePress(index)}
          disabled={disabled}
          style={styles.inputWrapper}
        >
          <TextInput
            style={[
              styles.input,
              digit ? styles.inputFilled : null,
              error ? styles.inputError : null,
              focusedIndex === index ? styles.inputFocused : null,
              disabled && styles.inputDisabled,
            ]}
            value={digit}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            secureTextEntry={secureTextEntry}
            editable={!disabled}
            accessibilityLabel={`Champ ${index + 1} sur ${length}`}
            accessibilityHint="Entrez un chiffre"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    maxWidth: 56,
  },
  input: {
    height: 56,
    width: "100%",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    textAlign: "center",
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  inputFilled: {
    borderColor: colors.primary,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: colors.surface,
  },
});
