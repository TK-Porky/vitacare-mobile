import { TouchableOpacity, View, Text, StyleSheet, StatusBar } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, fontFamily, fontSize } from '../../themes';

type Props = {
  title?: string;
  onBack?: () => void;
};

export function TopBar({ title, onBack }: Props) {
  const handleBack = onBack ?? (() => router.back());
  const statusBarHeight = StatusBar.currentHeight ?? 44;

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid1, colors.gradientMid2, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.container, { paddingTop: statusBarHeight + 48 }]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={20} color={colors.white} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        {title && <Text style={styles.title}>{title}</Text>}
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.white,
    fontFamily: fontFamily.medium,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontFamily: fontFamily.bold,
    color: colors.white,
    marginTop: 16,
  },
});