import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Initial landing / splash screen
 * The RootGuard in _layout.tsx will handle the actual redirection
 */
export default function SplashScreen() {
  return (
    <LinearGradient
      colors={['#10B981', '#059669']} // VitaCare Emerald Green
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Logo could go here */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});