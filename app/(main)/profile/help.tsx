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
import { colors, fontFamily, fontSize } from '../../../src/themes';
import { TopBar } from '../../../src/components';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Comment réserver un rendez-vous ?",
    answer: "Accédez à l'onglet Explorer, sélectionnez un professionnel de santé, puis appuyez sur Réserver. Suivez les 4 étapes : date, heure, motif et confirmation.",
  },
  {
    question: "Comment annuler un rendez-vous ?",
    answer: "Dans l'onglet Rendez-vous, ouvrez le détail du rendez-vous souhaité et appuyez sur Annuler. Une confirmation vous sera demandée.",
  },
  {
    question: "Comment modifier ma photo de profil ?",
    answer: "Accédez à Mes Informations depuis l'onglet Profil. Appuyez sur votre photo actuelle ou le bouton caméra pour sélectionner une nouvelle image depuis votre galerie.",
  },
  {
    question: "Comment télécharger mon ticket de rendez-vous ?",
    answer: "Depuis le détail d'un rendez-vous, appuyez sur l'icône de téléchargement dans la barre d'actions. Un PDF du ticket sera généré et partageable.",
  },
  {
    question: "Ma localisation n'est pas détectée, que faire ?",
    answer: "Vérifiez que l'accès à la localisation est autorisé dans les réglages de votre téléphone pour VitaCare. Vous pouvez aussi saisir votre adresse manuellement dans Ma localisation.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Oui. Vos données médicales et personnelles sont chiffrées et stockées de manière sécurisée conformément aux réglementations en vigueur au Cameroun. Consultez nos Termes et Conditions pour en savoir plus.",
  },
  {
    question: "Comment changer la langue de l'application ?",
    answer: "Dans le Profil, section Accessibilité, appuyez sur Changer la langue et sélectionnez votre langue préférée (Français ou Anglais).",
  },
];

const CONTACT_CHANNELS = [
  {
    id: 'email',
    icon: 'mail-outline' as const,
    label: 'Envoyer un e-mail',
    value: 'support@vitacare.cm',
    onPress: () => Linking.openURL('mailto:support@vitacare.cm'),
  },
  {
    id: 'whatsapp',
    icon: 'logo-whatsapp' as const,
    label: 'WhatsApp',
    value: '+237 600 000 000',
    onPress: () => Linking.openURL('https://wa.me/237600000000'),
  },
  {
    id: 'phone',
    icon: 'call-outline' as const,
    label: 'Appeler le support',
    value: '+237 600 000 000',
    onPress: () => Linking.openURL('tel:+237600000000'),
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <TouchableOpacity
      style={styles.faqCard}
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.75}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.inkMuted}
        />
      </View>
      {open && (
        <Text style={styles.faqAnswer}>{answer}</Text>
      )}
    </TouchableOpacity>
  );
}

function ContactChannel({
  icon,
  label,
  value,
  onPress,
}: (typeof CONTACT_CHANNELS)[0]) {
  return (
    <TouchableOpacity style={styles.channelCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.channelIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.channelLabel}>{label}</Text>
        <Text style={styles.channelValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <TopBar title="Aide" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="help-buoy-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Comment pouvons-nous vous aider ?</Text>
          <Text style={styles.heroSubtitle}>
            Trouvez une réponse dans la FAQ ou contactez notre équipe.
          </Text>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Questions fréquentes</Text>
        {FAQS.map((faq) => (
          <FAQItem key={faq.question} {...faq} />
        ))}

        {/* Contact */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Nous contacter</Text>
        {CONTACT_CHANNELS.map((ch) => (
          <ContactChannel key={ch.id} {...ch} />
        ))}

        {/* Version */}
        <Text style={styles.version}>VitaCare — Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 8,
  },

  // Hero
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

  // FAQ
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

  // Contact
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
