import React, { useRef, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { colors, fontFamily, fontSize } from '../../themes';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  error?: boolean;
}

export function OTPInput({
  length = 5,
  value,
  onChange,
  onComplete,
  autoFocus = true,
  error = false,
}: OTPInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const digits = value.split("").slice(0, length);
  while (digits.length < length) {
    digits.push("");
  }

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join("");
    onChange(newValue);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValue.length === length && onComplete) {
      onComplete(newValue);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.setNativeProps({ selection: { start: 0, end: 1 } });
  };

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputRefs.current[index] = ref; }}
          style={[
            styles.input,
            digit ? styles.inputFilled : null,
            error ? styles.inputError : null,
          ]}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 56,
    maxWidth: 52,
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
  inputError: {
    borderColor: colors.error,
  },
});