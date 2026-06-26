import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, fontFamily, fontSize } from '../../themes';

type Props = {
  label: string;
  checked: boolean;
  onToggle: () => void;
};

export function CheckboxField({ label, checked, onToggle }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Check size={12} color={colors.white} strokeWidth={3} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
});