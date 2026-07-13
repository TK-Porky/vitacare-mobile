import { User } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BaseInput, BaseInputProps } from "../generics/BaseInput";
import { colors } from "../../themes";

type Props = Omit<BaseInputProps, "leftSlot" | "keyboardType">;

/** Champ prénom / nom avec icône utilisateur. */
export function NameInput(props: Props) {
  const { t } = useTranslation();
  return (
    <BaseInput
      keyboardType="default"
      autoCapitalize="words"
      autoCorrect={false}
      secureTextEntry={false}
      placeholder={t('common.name')}
      leftSlot={
        <User size={16} color={colors.inkLight} style={{ opacity: 1.0 }} />
      }
      {...props}
    />
  );
}
