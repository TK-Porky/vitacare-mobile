import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../themes';
import { fontFamily, fontSize } from '../../themes';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function SelectOption({ label, selected = false, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  labelSelected: {
    fontFamily: fontFamily.medium,
    color: colors.ink,
  },
});