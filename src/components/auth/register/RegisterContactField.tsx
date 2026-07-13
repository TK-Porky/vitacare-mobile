import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const isPhone = mode === "phone";

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>
        {isPhone ? t("auth.loginPhone.phoneLabel") : t("auth.loginEmail.emailLabel")}
        <Text style={styles.required}> *</Text>
      </Text>
      {isPhone ? (
        <PhoneInput
          countryCode={countryCode}
          value={phone}
          onChangeText={onPhoneChange}
          placeholder={t("auth.loginPhone.phonePlaceholder")}
          error={!!error}
        />
      ) : (
        <EmailInput
          value={email}
          onChangeText={onEmailChange}
          placeholder={t("auth.loginEmail.emailPlaceholder")}
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
