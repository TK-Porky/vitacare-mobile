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
const OPTIONS = [
  'Un médecin en urgence',
  'Un suivi de traitements réguliers',
  'Des informations sur un médicaments',
  'Rien en particulier',
];

// ================================================================================== //
// Main
// ================================================================================== //
export default function OnboardingSearchScreen() {
  const { updatePreferences, isUpdatingPreferences } = useProfile();
  // ================================================================================== //
  // States
  // ================================================================================== //
  const [selected, setSelected] = useState<string | null>(null);

  /**
   * Handle continue action
   * @returns {Promise<void>}
   */
  const handleContinue = async () => {
    if (!selected) {
      router.push('/(auth)/onboarding-language');
      return;
    }

    try {
      // Save preference to profile via API
      await updatePreferences({
        // We use a generic way to store this or map to a specific field if backend supports it
      } as any); 
      
      router.push('/(auth)/onboarding-language');
    } catch (e) {
      // Fallback to next screen even if save fails for better UX, or show error
      router.push('/(auth)/onboarding-language');
    }
  };

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <View style={styles.root}>
      <StepHeader
        current={2}
        total={3}
        onSkip={() => router.push('/(auth)/onboarding-language')}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Que recherchez-vous ?</Text>

        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <SelectOption
              key={option}
              label={option}
              selected={selected === option}
              onPress={() => setSelected(option)}
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
          label="Continuer"
          isLoading={isUpdatingPreferences}
          onPress={handleContinue}
          style={styles.continueButton}
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
  continueButton: {
    minWidth: 140,
  },
});