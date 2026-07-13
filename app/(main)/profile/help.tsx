import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fontFamily, fontSize } from '../../../src/themes';
import { TopBar } from '../../../src/components';

const FAQS: { questionKey: string; answerKey: string }[] = [
  { questionKey: 'profile.helpScreen.faq1Q', answerKey: 'profile.helpScreen.faq1A' },
  { questionKey: 'profile.helpScreen.faq2Q', answerKey: 'profile.helpScreen.faq2A' },
  { questionKey: 'profile.helpScreen.faq3Q', answerKey: 'profile.helpScreen.faq3A' },
  { questionKey: 'profile.helpScreen.faq4Q', answerKey: 'profile.helpScreen.faq4A' },
  { questionKey: 'profile.helpScreen.faq5Q', answerKey: 'profile.helpScreen.faq5A' },
  { questionKey: 'profile.helpScreen.faq6Q', answerKey: 'profile.helpScreen.faq6A' },
  { questionKey: 'profile.helpScreen.faq7Q', answerKey: 'profile.helpScreen.faq7A' },
];

const CONTACT_CHANNELS = [
  {
    id: 'email',
    icon: 'mail-outline' as const,
    labelKey: 'profile.helpScreen.sendEmail',
    value: 'support@vitacare.cm',
    onPress: () => Linking.openURL('mailto:support@vitacare.cm'),
  },
  {
    id: 'whatsapp',
    icon: 'logo-whatsapp' as const,
    labelKey: 'WhatsApp',
    value: '+237 600 000 000',
    onPress: () => Linking.openURL('https://wa.me/237600000000'),
  },
  {
    id: 'phone',
    icon: 'call-outline' as const,
    labelKey: 'profile.helpScreen.callSupport',
    value: '+237 600 000 000',
    onPress: () => Linking.openURL('tel:+237600000000'),
  },
];

function FAQItem({ questionKey, answerKey }: { questionKey: string; answerKey: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.faqCard}
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.75}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{t(questionKey)}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.inkMuted}
        />
      </View>
      {open && (
        <Text style={styles.faqAnswer}>{t(answerKey)}</Text>
      )}
    </TouchableOpacity>
  );
}

function ContactChannel({
  icon,
  labelKey,
  value,
  onPress,
}: {
  icon: (typeof CONTACT_CHANNELS)[0]['icon'];
  labelKey: string;
  value: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity style={styles.channelCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.channelIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.channelLabel}>{t(labelKey)}</Text>
        <Text style={styles.channelValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <TopBar title={t('profile.helpScreen.title')} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="help-buoy-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>{t('profile.helpScreen.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('profile.helpScreen.heroSubtitle')}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>{t('profile.helpScreen.faq')}</Text>
        {FAQS.map((faq) => (
          <FAQItem key={faq.questionKey} questionKey={faq.questionKey} answerKey={faq.answerKey} />
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>{t('profile.helpScreen.contact')}</Text>
        {CONTACT_CHANNELS.map((ch) => (
          <ContactChannel key={ch.id} icon={ch.icon} labelKey={ch.labelKey} value={ch.value} onPress={ch.onPress} />
        ))}

        <Text style={styles.version}>{t('profile.helpScreen.version')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 8,
  },

  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
    marginBottom: 8,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
    marginTop: 8,
  },

  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.ink,
    lineHeight: 20,
  },
  faqAnswer: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    lineHeight: 20,
    marginTop: 12,
  },

  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  channelValue: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: 2,
  },

  version: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});
