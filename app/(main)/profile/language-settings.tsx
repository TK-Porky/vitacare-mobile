import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import i18next from '@/i18n';
import { colors, fontFamily, fontSize } from '../../../src/themes';
import { TopBar, HelperText } from '../../../src/components';
import { useProfile } from '../../../src/hooks';

type Language = {
  id: string;
  nativeLabel: string;
  flag: string;
};

const LANGUAGES: Language[] = [
  { id: 'fr', nativeLabel: 'Français', flag: '🇫🇷' },
  { id: 'en', nativeLabel: 'English', flag: '🇬🇧' },
];

export default function LanguageSettingsScreen() {
  const { t } = useTranslation();
  const { updatePreferences, isUpdatingPreferences, error } = useProfile();
  const [selectedLang, setSelectedLang] = useState('fr');

  const handleSelect = async (langId: string) => {
    setSelectedLang(langId);
    i18next.changeLanguage(langId);
    await updatePreferences({ language: langId });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <TopBar title={t('profile.languageScreen.title')} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.languageScreen.subtitle')}</Text>
          <Text style={styles.subtitle}>
            {t('profile.chooseLanguage')}
          </Text>
        </View>

        <View style={styles.list}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                style={[styles.langCard, isSelected && styles.langCardSelected]}
                onPress={() => handleSelect(lang.id)}
                activeOpacity={0.7}
                disabled={isUpdatingPreferences}
              >
                <View style={styles.flagWrapper}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                </View>
                
                <View style={styles.langInfo}>
                  <Text style={styles.langLabel}>{t(`profile.languageScreen.${lang.id === 'fr' ? 'french' : 'english'}`)}</Text>
                  <Text style={styles.nativeLabel}>{lang.nativeLabel}</Text>
                </View>

                {isSelected && (
                  isUpdatingPreferences ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <CheckCircle2 size={24} color={colors.primary} />
                  )
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        {error && (
          <View style={{ marginTop: 20 }}>
            <HelperText message={error as string} type="error" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    lineHeight: 20,
  },
  list: {
    gap: 16,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 16,
  },
  langCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  flagWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  flag: {
    fontSize: 24,
  },
  langInfo: {
    flex: 1,
    gap: 2,
  },
  langLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  nativeLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
  },
});
