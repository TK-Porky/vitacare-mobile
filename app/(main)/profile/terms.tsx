import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fontFamily, fontSize } from '../../../src/themes';
import { TopBar } from '../../../src/components';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. Objet',
    body: "Les présentes conditions régissent l'utilisation de l'application mobile VitaCare, développée et opérée par VitaCare SAS, immatriculée au Registre du Commerce et du Crédit Mobilier de Yaoundé. En téléchargant ou en utilisant l'application, vous acceptez sans réserve les présentes conditions.",
  },
  {
    title: '2. Services proposés',
    body: "VitaCare est une plateforme de prise de rendez-vous médicaux, de suivi de traitements et d'accès à des professionnels de santé agréés au Cameroun. L'application ne fournit pas de conseils médicaux et ne remplace en aucun cas une consultation avec un médecin qualifié.",
  },
  {
    title: '3. Inscription et compte utilisateur',
    body: "L'accès aux fonctionnalités de VitaCare nécessite la création d'un compte. Vous vous engagez à fournir des informations exactes et à les maintenir à jour. Toute utilisation frauduleuse ou non autorisée de votre compte doit être signalée immédiatement à notre équipe de support.",
  },
  {
    title: '4. Protection des données personnelles',
    body: "VitaCare collecte et traite vos données conformément à la loi camerounaise n° 2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité. Vos données médicales sont chiffrées au repos et en transit. Elles ne sont jamais revendues à des tiers. Vous disposez d'un droit d'accès, de rectification et de suppression de vos données.",
  },
  {
    title: '5. Responsabilités',
    body: "VitaCare s'engage à maintenir l'application disponible au mieux de ses capacités mais ne peut garantir une disponibilité ininterrompue. Les professionnels de santé inscrits sur la plateforme sont responsables de leurs actes médicaux. VitaCare agit uniquement comme intermédiaire technique.",
  },
  {
    title: '6. Propriété intellectuelle',
    body: "L'ensemble des éléments constituant VitaCare (logo, interface, algorithmes, contenus) est protégé par les droits de propriété intellectuelle applicables. Toute reproduction, même partielle, sans autorisation écrite préalable est interdite.",
  },
  {
    title: '7. Tarification et paiements',
    body: "Certains services peuvent être payants. Les prix sont indiqués en XCFA (Franc CFA). Les paiements s'effectuent via Mobile Money, Orange Money ou carte bancaire. VitaCare applique des frais de service de 5 % sur chaque transaction.",
  },
  {
    title: '8. Résiliation',
    body: "Vous pouvez supprimer votre compte à tout moment depuis l'onglet Profil > Compte > Supprimer mon compte. VitaCare se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes conditions.",
  },
  {
    title: '9. Droit applicable',
    body: "Les présentes conditions sont soumises au droit camerounais. Tout litige sera soumis à la juridiction compétente de Yaoundé, Cameroun.",
  },
  {
    title: '10. Contact',
    body: "Pour toute question relative aux présentes conditions : legal@vitacare.cm — VitaCare SAS, Avenue Ahidjo, Yaoundé, Cameroun.",
  },
];

export default function TermsScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <TopBar title={t('profile.termsScreen.title')} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="document-text-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>{t('profile.termsScreen.headerTitle')}</Text>
          <Text style={styles.headerMeta}>{t('profile.termsScreen.lastUpdate')}</Text>
          <Text style={styles.headerIntro}>
            {t('profile.termsScreen.intro')}
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={styles.noticeText}>
            {t('profile.termsScreen.notice')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 16,
  },

  header: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingVertical: 16,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
    textAlign: 'center',
  },
  headerMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  headerIntro: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
  },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  sectionBody: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    lineHeight: 22,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  noticeText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
    lineHeight: 20,
  },
});
