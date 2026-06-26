import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors, fontFamily, fontSize } from '../../themes';

type Props = {
  title: string;
  onSeeAll?: () => void;
};

export function SectionHeader({ title, onSeeAll }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity
          style={styles.seeAll}
          onPress={onSeeAll}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>Tout voir</Text>
          <ArrowRight size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});