import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { BaseInput, BaseInputProps } from '../generics/BaseInput';
import { colors } from '../../themes';

type Props = Omit<BaseInputProps, 'leftSlot' | 'rightSlot' | 'secureTextEntry'>;

/**
 * Champ mot de passe avec toggle visibilité.
 * La logique show/hide est encapsulée ici — le parent n'a pas à la gérer.
 */
export function PasswordInput(props: Props) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <BaseInput
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      placeholder="Mot de passe"
      leftSlot={<Lock size={16} color={colors.inkLight} style={{ opacity: 1.0 }} />}
      rightSlot={
        <TouchableOpacity onPress={() => setVisible((v) => !v)} activeOpacity={0.7}>
          <Icon size={18} color={colors.primary} style={{ opacity: 1.0 }} />
        </TouchableOpacity>
      }
      {...props}
    />
  );
}