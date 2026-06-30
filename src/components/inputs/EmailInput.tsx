import { Mail } from "lucide-react-native";
import { BaseInput, BaseInputProps } from "../generics/BaseInput";
import { colors } from "../../themes";

type Props = Omit<BaseInputProps, "leftSlot" | "keyboardType">;

export function EmailInput(props: Props) {
  return (
    <BaseInput
      secureTextEntry={false}
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="email-address"
      placeholder="Adresse email"
      leftSlot={
        <Mail size={16} color={colors.inkLight} style={{ opacity: 1.0 }} />
      }
      {...props}
    />
  );
}
