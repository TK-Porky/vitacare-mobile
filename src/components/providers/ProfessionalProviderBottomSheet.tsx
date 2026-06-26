import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppBottomSheet, AppBottomSheetRef } from '../generics';
import { PrimaryButton } from '../buttons';
import { colors, fontFamily, fontSize } from '../../themes';

export type ReservationStatus = 'none' | 'confirmed' | 'pending';

type Provider = {
  clinicName: string;
  avatarUri: string;
  specialty: string;
  experience: string;
  language: string;
  doctorName: string;
  description: string;
  hoursRange?: string;
  hoursdays?: string;
  location: string;
  coverUri?: string;
};

export type ProfessionalProviderBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  provider?: Provider;
  reservationStatus?: ReservationStatus;
  onShare?: () => void;
  onReservation?: () => void;
  onCancelReservation?: () => void;
  onShowOnMap?: () => void;
  onClose?: () => void;
};

const DEFAULT_PROVIDER: Provider = {
  clinicName: 'Clinique Wellstar Bastos',
  avatarUri: 'https://randomuser.me/api/portraits/men/75.jpg',
  specialty: 'Génycologue',
  experience: '+3 Ans',
  language: 'FR-EN',
  doctorName: 'Dr. Igriss Kakmo',
  description:
    'Votre médecin traitant spécialisé en gynécologie et en santé de vos organes reproducteurs',
  hoursRange: 'De 9:00 à 20:00',
  hoursdays: 'Lundi à Samedi',
  location: 'Bastos, Yaoundé',
  coverUri:
    'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600',
};

const StatusBadge = ({ status }: { status: ReservationStatus }) => {
  if (status === 'none') return null;

  const isConfirmed = status === 'confirmed';
  return (
    <View style={[styles.badge, isConfirmed ? styles.badgeConfirmed : styles.badgePending]}>
      <Text style={[styles.badgeText, isConfirmed ? styles.badgeTextConfirmed : styles.badgeTextPending]}>
        {isConfirmed ? 'Confirmé' : 'En attente de validation'}
      </Text>
    </View>
  );
};

const StatColumn = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.statColumn}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoRow = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={16} color={colors.inkMuted} />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

export const ProfessionalProviderBottomSheet = forwardRef<
  ProfessionalProviderBottomSheetRef,
  Props
>(
  (
    {
      provider = DEFAULT_PROVIDER,
      reservationStatus = 'none',
      onShare,
      onReservation,
      onCancelReservation,
      onShowOnMap,
      onClose,
    },
    ref,
  ) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    const handleShare = () => {
      onShare?.();
    };

    const handleReservation = () => {
      onReservation?.();
      sheetRef.current?.close();
    };

    const handleCancelReservation = () => {
      onCancelReservation?.();
      sheetRef.current?.close();
    };

    const hasReservation = reservationStatus !== 'none';

    return (
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={['55%', '92%']}
        onClose={onClose}
        scrollable
        containerStyle={styles.sheet}
      >
        <View style={styles.titleRow}>
          <Text style={styles.clinicName} numberOfLines={1}>
            {provider.clinicName}
          </Text>
          <StatusBadge status={reservationStatus} />
        </View>

        <View style={styles.header}>
          <Image source={{ uri: provider.avatarUri }} style={styles.avatar} />
          <View style={styles.statsRow}>
            <StatColumn value={provider.specialty} label="Spécialité" />
            <View style={styles.statDivider} />
            <StatColumn value={provider.experience} label="Expérience" />
            <View style={styles.statDivider} />
            <StatColumn value={provider.language} label="Langue" />
          </View>
        </View>

        <Text style={styles.doctorName}>{provider.doctorName}</Text>
        <Text style={styles.description}>{provider.description}</Text>

        <View style={styles.ctaRow}>
          {hasReservation ? (
            <PrimaryButton
              label="Annuler la réservation"
              variant="outline"
              size="md"
              fullWidth={true}
              onPress={handleCancelReservation}
              style={styles.ctaBtn}
            />
          ) : (
            <PrimaryButton
              label="Faire une réservation"
              variant="solid"
              size="md"
              onPress={handleReservation}
              fullWidth={true}
              style={styles.ctaBtn}
            />
          )}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {provider.hoursRange && provider.hoursdays && (
          <>
            <Text style={styles.sectionTitle}>Heures de services</Text>
            <InfoRow icon="time-outline" text={provider.hoursRange} />
            <InfoRow icon="calendar-outline" text={provider.hoursdays} />
          </>
        )}

        <Text style={styles.sectionTitle}>Lieu de service</Text>
        <InfoRow icon="location-outline" text={provider.location} />

        {provider.coverUri && (
          <Image
            source={{ uri: provider.coverUri }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        <TouchableOpacity style={styles.mapBtn} onPress={onShowOnMap}>
          <Ionicons name="map-outline" size={18} color={colors.ink} />
          <Text style={styles.mapBtnText}>Montrer sur la Carte</Text>
        </TouchableOpacity>
      </AppBottomSheet>
    );
  },
);

ProfessionalProviderBottomSheet.displayName = 'ProfessionalProviderBottomSheet';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  clinicName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeConfirmed: {
    backgroundColor: '#E6F9EE',
  },
  badgePending: {
    backgroundColor: '#FFF4E5',
  },
  badgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  badgeTextConfirmed: {
    color: '#1A7F3C',
  },
  badgeTextPending: {
    color: '#B45309',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  doctorName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    marginBottom: 6,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  ctaBtn: {
    flex: 1,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
    marginBottom: 8,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkMuted,
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: colors.border,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  mapBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
});
