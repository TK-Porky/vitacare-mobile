import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components';
import { colors, fontFamily, fontSize } from '../../src/themes';

// ================================================================================== //
// Main
// ================================================================================== //
export default function LandingScreen() {
  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid1, colors.gradientMid2, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.iconArea}>
        
      </View>

      <View style={styles.sheet}>
        <Text style={styles.title}>Bienvenue !</Text>

        <View style={styles.info}>
          <Text style={styles.subtitle}>Vous revoilà !</Text>
          <Text style={styles.desc}>
            Votre service de santé numérique à portée de mains.{'\n'}
            Prenez soin de vous et vos proches mieux qu'avant !
          </Text>
        </View>

        <View style={styles.cta}>
          <PrimaryButton
            label="Se connecter par Téléphone"
            onPress={() => router.push('/(auth)/login-phone')}
            fullWidth={true}
            icon={<Ionicons name="phone-portrait" size={18} color={colors.white} />}
          />
          
          <PrimaryButton
            label="Se connecter par Email"
            onPress={() => router.push('/(auth)/login-email')}
            variant='outline'
            fullWidth={true}
            icon={<Ionicons name="mail" size={18} color={colors.inkLight} />}
          />

          <Text style={styles.or}>OU</Text>

          <PrimaryButton
            label="Créer un compte"
            onPress={() => router.push('/(auth)/register')}
            variant='outline'
            fullWidth={true}
            icon={<Ionicons name="person" size={18} color={colors.inkLight} />}
          />
        </View>

        <Text style={styles.legal}>
          L'utilisation de l'application marque l'accord avec nos {' '}
          <Text style={styles.legalBold}>conditions d'utilisation</Text>
          {' '}et notre {' '}
          <Text style={styles.legalBold}>politique de confidentialité</Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    display: 'flex',
    flexDirection: "column",
    gap: 24,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  title: { 
    fontFamily: fontFamily.bold, 
    fontSize: fontSize['2xl'], 
    textAlign: 'center', 
    color: colors.ink 
  },
  info: {
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  subtitle: { 
    opacity: 0.6,
    fontFamily: fontFamily.medium, 
    fontSize: fontSize.md, 
    color: colors.ink, 
    textAlign: 'center' 
  },
  desc: { 
    opacity: 0.6,
    fontFamily: fontFamily.regular, 
    fontSize: fontSize.md, 
    color: colors.ink, 
    textAlign: 'center', 
    lineHeight: 20 },
  cta: {
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  legal: { 
    fontSize: fontSize.sm, 
    color: colors.inkMuted, 
    textAlign: 'center', 
    lineHeight: 18 
  },
  legalBold: { 
    color: colors.ink, 
    fontFamily: fontFamily.semiBold 
  },
  or: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    textAlign: 'center',
  },
});