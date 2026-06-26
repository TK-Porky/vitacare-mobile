import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StepHeader, SelectOption, PrimaryButton } from '../../src/components';
import { colors, fontFamily, fontSize } from '../../src/themes';
import { useProfile } from '../../src/hooks';

// ... (rest same)

// ================================================================================== //
// Types
// ================================================================================== //
const LANGUAGES = ['Français', 'Anglais'];

// ================================================================================== //
// Main
// ================================================================================== //
export default function OnboardingLanguageScreen() {
  const { updatePreferences, isUpdatingPreferences } = useProfile();
  // ================================================================================== //
  // States
  // ================================================================================== //
  const [selected, setSelected] = useState<string>('Français'); // Selected language

  /**
   * Finalize the onboarding
   * @returns
   */
  const handleFinish = async () => {
    try {
      // Save language preference to profile
      await updatePreferences({
        language: selected === 'Français' ? 'fr' : 'en'
      });
      
      router.push('/(auth)/onboarding-success');
    } catch (e) {
      // UX: Navigate anyway if it fails, or show warning
      router.push('/(auth)/onboarding-success');
    }
  };

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <View style={styles.root}>
      <StepHeader
        current={3}
        total={3}
        showSkip={false}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Quelle langue parlez-vous ?</Text>

        <View style={styles.options}>
          {LANGUAGES.map((lang) => (
            <SelectOption
              key={lang}
              label={lang}
              selected={selected === lang}
              onPress={() => setSelected(lang)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={16} color={colors.ink} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <PrimaryButton
          label="Terminer"
          isLoading={isUpdatingPreferences}
          onPress={handleFinish}
          style={styles.finishButton}
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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 24,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.ink,
  },
  options: {
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  finishButton: {
    minWidth: 140,
  },
});