import { Mail } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BaseInput, BaseInputProps } from "../generics/BaseInput";
import { colors } from "../../themes";

type Props = Omit<BaseInputProps, "leftSlot" | "keyboardType">;

export function EmailInput(props: Props) {
  const { t } = useTranslation();
  return (
    <BaseInput
      secureTextEntry={false}
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="email-address"
      placeholder={t('common.email')}
      leftSlot={
        <Mail size={16} color={colors.inkLight} style={{ opacity: 1.0 }} />
      }
      {...props}
    />
  );
}
