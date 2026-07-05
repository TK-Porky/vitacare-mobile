import { View, Text, StyleSheet } from "react-native";
import { PhoneInput, EmailInput, HelperText } from "@/components";
import { colors, fontFamily, fontSize } from "@/themes";
import { RegisterMode } from "@/utils/register-validation";

type RegisterContactFieldProps = {
  mode: RegisterMode;
  phone: string;
  email: string;
  countryCode: string;
  onPhoneChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  error?: string;
};

export const RegisterContactField = ({
  mode,
  phone,
  email,
  countryCode,
  onPhoneChange,
  onEmailChange,
  error,
}: RegisterContactFieldProps) => {
  const isPhone = mode === "phone";

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>
        {isPhone ? "Numéro de téléphone" : "Adresse email"}
        <Text style={styles.required}> *</Text>
      </Text>
      {isPhone ? (
        <PhoneInput
          countryCode={countryCode}
          value={phone}
          onChangeText={onPhoneChange}
          placeholder="6 XX XX XX XX"
          error={!!error}
        />
      ) : (
        <EmailInput
          value={email}
          onChangeText={onEmailChange}
          placeholder="exemple@email.com"
          error={!!error}
        />
      )}
      {error && <HelperText message={error} type="error" />}
    </View>
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
});
