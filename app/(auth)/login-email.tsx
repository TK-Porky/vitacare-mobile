import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { TopBar, CustomInput, PasswordInput, PrimaryButton, HelperText, CheckboxField, EmailInput } from '../../src/components';
import { colors, fontFamily, fontSize } from '../../src/themes';
import { useAuth } from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/store';

// ================================================================================== //
// Main
// ================================================================================== //
export default function LoginEmailScreen() {
  // ================================================================================== //
  // States
  // ================================================================================== //
  const [email, setEmail] = useState('');  // Email input
  const [password, setPassword] = useState('');  // Password input
  const [rememberMe, setRememberMe] = useState(false);  // Remember me checkbox
  const [localError, setLocalError] = useState('');  // Local validation error
  
  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const { loginEmail, isLoggingInEmail } = useAuth();  // Auth hook
  const storeError = useAuthStore(state => state.error);  // Store error
  const clearStoreError = useAuthStore(state => state.clearError);  // Clear store error

  // ================================================================================== //
  // Effects
  // ================================================================================== //
  useEffect(() => {
    // Clear any previous global errors when entering screen
    clearStoreError();
  }, []);

  // ================================================================================== //
  // Functions
  // ================================================================================== //
  
  /**
   * Validate form inputs
   * @returns 
   */
  const validate = () => {
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Adresse email invalide.');
      return false;
    }
    if (password.length < 8) {
      setLocalError('Le mot de passe doit contenir au moins 8 caractères.');
      return false;
    }
    return true;
  };

  /**
   * Handle form submission
   * @returns 
   */
  const handleSubmit = async () => {
    if (!validate()) return;
    setLocalError('');
    clearStoreError();
    
    loginEmail({ email, password, rememberMe });
  };

  /**
   * Handle Google login
   * @returns 
   */
  const handleGoogle = async () => {
    // TODO: Google OAuth
  };

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TopBar />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Connexion par Email</Text>
          <Text style={styles.subtitle}>
            Entrer votre numéro pour recevoir un code de confirmation
          </Text>
        </View>

        <View style={styles.form}>
          <EmailInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (localError) setLocalError('');
              if (storeError) clearStoreError();
            }}
          />

          <PasswordInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (localError) setLocalError('');
              if (storeError) clearStoreError();
            }}
          />

          <View style={styles.rememberRow}>
            <CheckboxField
              label="Souviens-toi de moi"
              checked={rememberMe}
              onToggle={() => setRememberMe(v => !v)}
            />
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={styles.forgotText}>Mot de passe oublié</Text>
            </TouchableOpacity>
          </View>

          {localError || storeError ? (
            <HelperText message={localError || (storeError as string)} type="error" />
          ) : null}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Se connecter"
            fullWidth
            isLoading={isLoggingInEmail}
            onPress={handleSubmit}
          />

          <Text style={styles.or}>OR</Text>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogle}
            activeOpacity={0.7}
            disabled={isLoggingInEmail}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Se connecter via Google</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            En continuant, vous acceptez nos{' '}
            <Text style={styles.link}>conditions d'utilisation</Text>
            {' '}et notre{' '}
            <Text style={styles.link}>politique de confidentialité</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 32,
  },
  header: {
    gap: 6,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.inkMuted,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  footer: {
    gap: 16,
    alignItems: 'center',
  },
  or: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  googleIcon: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: '#4285F4',
  },
  googleText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  terms: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
});