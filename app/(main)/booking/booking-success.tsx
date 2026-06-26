import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../../src/components/buttons';
import { colors, fontFamily, fontSize } from '../../../src/themes';

// ================================================================================== //
// Main
// ================================================================================== //
export default function BookingSuccessScreen() {
  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const router = useRouter();

  // ================================================================================== //
  // Placeholder Data
  // ================================================================================== //
  const {
    doctorName = 'Dr. Igriss Kakmo',
    specialty = 'Génycologue',
    avatarUri = 'https://randomuser.me/api/portraits/men/75.jpg',
    date = 'Jeudi, 26 Mars 2026',
    time = '12h00',
    paymentLabel = 'Paiement à la consultation',
    location = 'Clinique Wellstar\nBastos, Yaoundé',
  } = useLocalSearchParams<{
    doctorName?: string;
    specialty?: string;
    avatarUri?: string;
    date?: string;
    time?: string;
    paymentLabel?: string;
    location?: string;
  }>();

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={[styles.content]}>
        {/* ── Illustration / icon ── */}
        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
        </View>

        {/* ── Title ── */}
        <Text style={styles.title}>Merci pour votre réservation !</Text>
        <Text style={styles.subtitle}>Votre réservation est en attente de confirmation.</Text>

        {/* ── Summary card ── */}
        <View style={styles.card}>
          {/* Doctor row */}
          <View style={styles.doctorRow}>
            <Image source={{ uri: avatarUri as string }} style={styles.avatar} />
            <View>
              <Text style={styles.doctorName}>{doctorName}</Text>
              <Text style={styles.doctorSpecialty}>{specialty}</Text>
            </View>
          </View>

          {/* Date */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.ink} />
            <Text style={[styles.infoText, { fontFamily: fontFamily.semiBold }]}>
              {date} à {time}
            </Text>
          </View>

          {/* Payment */}
          <Text style={styles.infoText}>{paymentLabel}</Text>

          {/* Location */}
          <Text style={styles.infoText}>{(location as string).replace('\\n', '\n')}</Text>
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={styles.footer}>
        <PrimaryButton
          label="Voir mes réservations"
          variant="solid"
          size="md"
          onPress={() => router.replace('/(main)/(tabs)/appointments' as never)}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 4,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: colors.ltsurface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
  },
  doctorName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  doctorSpecialty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkMuted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  infoText: {
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    height: '10%'
  },
  cta: {
    width: '100%',
  },
});