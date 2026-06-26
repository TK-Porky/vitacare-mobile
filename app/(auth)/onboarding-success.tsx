import {
    View,
    Text,
    StyleSheet,
    Image,
  } from 'react-native';
  import { router } from 'expo-router';
  import { PrimaryButton } from '../../src/components';
  import { colors, fontFamily, fontSize } from '../../src/themes';
  
  // ================================================================================== //
  // Main
  // ================================================================================== //
  export default function OnboardingSuccessScreen() {
    // ================================================================================== //
    // Render
    // ================================================================================== //
    return (
      <View style={styles.root}>
        <View style={styles.content}>
          <View style={styles.illustration}>
            {/* TODO: remplacer par l'illustration Penpot */}
            <View style={styles.illustrationPlaceholder} />
          </View>
  
          <View style={styles.textBlock}>
            <Text style={styles.title}>Félicitations !</Text>
            <Text style={styles.subtitle}>
              Votre compte a été créé et activer avec succès !{'\n'}
              Nous sommes très heureux de pouvoir vous aider.
            </Text>
          </View>
        </View>
  
        <View style={styles.footer}>
          <PrimaryButton
            label="Terminer"
            fullWidth
            onPress={() => router.replace('/(main)')}
          />
        </View>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.white,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 40,
    },
    illustration: {
      width: '100%',
      alignItems: 'center',
    },
    illustrationPlaceholder: {
      width: 220,
      height: 220,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    textBlock: {
      alignItems: 'center',
      gap: 12,
    },
    title: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize['3xl'],
      color: colors.ink,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md,
      color: colors.inkLight,
      textAlign: 'center',
      lineHeight: 22,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
  });