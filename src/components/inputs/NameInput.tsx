import { User } from 'lucide-react-native';
import { BaseInput, BaseInputProps } from '../generics/BaseInput';
import { colors } from '../../themes';

type Props = Omit<BaseInputProps, 'leftSlot' | 'keyboardType'>;

/** Champ prénom / nom avec icône utilisateur. */
export function NameInput(props: Props) {
  return (
    <BaseInput
      keyboardType="default"
      autoCapitalize="words"
      placeholder="Nom complet"
      leftSlot={<User size={16} color={colors.inkLight} style={{ opacity: 1.0 }} />}
      {...props}
    />
  );
}