import { View, StyleSheet } from 'react-native';
import { Mail } from 'lucide-react-native';
import { BaseInput, BaseInputProps } from '../generics/BaseInput';
import { colors } from '../../themes';

type Props = Omit<BaseInputProps, 'leftSlot' | 'keyboardType'>;

export function EmailInput({
  value,
  ...baseProps
}: Props) {
  return (
    <BaseInput
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      placeholder="Adresse email"
      value={value}
      leftSlot={
        <View style={styles.leftSlot}>
          <Mail size={16} color={colors.inkLight} style={{ opacity: 1.0 }} />
        </View>
      }
      {...baseProps}
    />
  );
}

const styles = StyleSheet.create({
  leftSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }
})