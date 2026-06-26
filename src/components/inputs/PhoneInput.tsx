import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, Phone } from 'lucide-react-native';
import { BaseInput, BaseInputProps } from '../generics/BaseInput';
import { colors, fontFamily, fontSize } from '../../themes';
import { formatCMPhone } from "@vitacare/utils";

type Props = Omit<BaseInputProps, 'leftSlot' | 'keyboardType'> & {
  countryCode?: string;
  onCountryPress?: () => void;
};

/**
 * Champ téléphone avec sélecteur d'indicatif pays.
 * Étend BaseInput via composition (pas d'héritage, pas de duplication).
 */
export function PhoneInput({
  countryCode = '+237',
  onCountryPress,
  onChangeText,
  value,
  ...baseProps
}: Props) {

  const handleTextChange = (text: string) => {
    if (onChangeText) {
      const formatted = formatCMPhone(text);
      onChangeText(formatted);
    }
  };

  return (
    <BaseInput
      keyboardType="phone-pad"
      placeholder="Numéro de téléphone"
      onChangeText={handleTextChange}
      value={value}
      maxLength={15}
      leftSlot={
        <View style={styles.leftSlot}>
          <TouchableOpacity
            style={styles.countryCode}
            onPress={onCountryPress}
            activeOpacity={0.7}
          >
            <Text style={styles.countryText}>{countryCode}</Text>
            <ChevronDown size={14} color={colors.inkLight} opacity={1.0} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <Phone size={16} color={colors.inkLight} style={{ opacity: 1.0 }} />
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
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.ink,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: colors.inkFaint,
  },
});