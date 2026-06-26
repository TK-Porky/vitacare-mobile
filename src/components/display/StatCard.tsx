import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamily, fontSize } from '../../themes';

type Props = {
  icon: React.ReactNode;
  value: string | number;
  label: string;
};

export function StatCard({ icon, value, label }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    backgroundColor: colors.white,
  },
  icon: {
    marginBottom: 4,
  },
  value: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
    lineHeight: 14,
  },
});