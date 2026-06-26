import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ProgressBar } from '../../../src/components/booking/ProgressBar';
import { StepDate } from '../../../src/components/booking/StepDate';
import { StepTime } from '../../../src/components/booking/StepTime';
import { StepReason } from '../../../src/components/booking/StepReason';
import { StepConfirm } from '../../../src/components/booking/StepConfirm';
import { PrimaryButton } from '../../../src/components/buttons/PrimaryButton';
import { MomoPaymentSheet } from '../../../src/components/payment/MomoPaymentSheet';
import { OrangePaymentSheet } from '../../../src/components/payment/OrangePaymentSheet';
import { CardPaymentSheet } from '../../../src/components/payment/CardPaymentSheet';
import type { PaymentSheetRef } from '../../../src/components/payment/MomoPaymentSheet';
import { colors, fontFamily, fontSize } from '../../../src/themes';
import { apiClient } from '../../../src/lib/api.client';
import { API_ENDPOINTS } from '../../../src/types/api-endpoints';
import { appointmentService } from '../../../src/services/appointment.service';

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingData = {
  date: Date | null;
  time: string | null;
  reason: string;
  paymentMethod: 'now' | 'later';
  paymentProvider: 'mobile_money' | 'orange_money' | 'card';
};

type Provider = {
  id?: number;
  name: string;
  specialty: string;
  avatarUri: string;
  priceXCFA: number;
  location: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const DAYS   = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const DEFAULT_PROVIDER: Provider = {
  name: 'Dr. Igriss Kakmo',
  specialty: 'Gynécologue',
  avatarUri: 'https://randomuser.me/api/portraits/men/75.jpg',
  priceXCFA: 5000,
  location: 'Clinique Wellstar, Bastos, Yaoundé',
};

const DEFAULT_BOOKING: BookingData = {
  date: null,
  time: '08:00',
  reason: '',
  paymentMethod: 'now',
  paymentProvider: 'mobile_money',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    providerId?: string;
    providerName?: string;
    specialty?: string;
    avatarUri?: string;
    priceXCFA?: string;
    location?: string;
  }>();

  const provider: Provider = {
    id: params.providerId ? Number(params.providerId) : undefined,
    name: params.providerName ?? DEFAULT_PROVIDER.name,
    specialty: params.specialty ?? DEFAULT_PROVIDER.specialty,
    avatarUri: params.avatarUri ?? DEFAULT_PROVIDER.avatarUri,
    priceXCFA: params.priceXCFA ? Number(params.priceXCFA) : DEFAULT_PROVIDER.priceXCFA,
    location: params.location ?? DEFAULT_PROVIDER.location,
  };

  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingData>(DEFAULT_BOOKING);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[] | undefined>(undefined);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Payment sheet refs
  const momoSheetRef   = useRef<PaymentSheetRef>(null);
  const orangeSheetRef = useRef<PaymentSheetRef>(null);
  const cardSheetRef   = useRef<PaymentSheetRef>(null);

  // Store created appointment ID for payment
  const createdAppointmentId = useRef<number | null>(null);

  const patchBooking = useCallback((patch: Partial<BookingData>) => {
    setBooking(prev => {
      const next = { ...prev, ...patch };
      if ('date' in patch && patch.date !== prev.date) {
        next.time = null;
      }
      return next;
    });
  }, []);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!booking.date || !provider.id) {
      setAvailableSlots(undefined);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    const y = booking.date.getFullYear();
    const m = String(booking.date.getMonth() + 1).padStart(2, '0');
    const d = String(booking.date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const mon = new Date(booking.date);
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    const wy = mon.getFullYear();
    const wm = String(mon.getMonth() + 1).padStart(2, '0');
    const wd = String(mon.getDate()).padStart(2, '0');
    const weekStart = `${wy}-${wm}-${wd}`;

    apiClient.get<any>(API_ENDPOINTS.CLINICS.AVAILABLE_SLOTS(provider.id), { weekStart })
      .then(res => {
        if (cancelled) return;
        if (!res.success) { setAvailableSlots(undefined); return; }
        const raw: any[] = res.data ?? [];
        const times = raw
          .filter((s: any) => s.startTime?.startsWith(dateStr) && !s.isBooked)
          .map((s: any) => s.startTime.split('T')[1].slice(0, 5));
        setAvailableSlots(times);
      })
      .catch(() => { if (!cancelled) setAvailableSlots(undefined); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });

    return () => { cancelled = true; };
  }, [booking.date, provider.id]);

  const canContinue = (): boolean => {
    if (step === 1) return booking.date !== null;
    if (step === 2) return booking.time !== null;
    return true;
  };

  const navigateToSuccess = useCallback((appointmentId: number) => {
    const dateLabel = booking.date
      ? `${DAYS[booking.date.getDay()]}, ${booking.date.getDate()} ${MONTHS[booking.date.getMonth()]} ${booking.date.getFullYear()}`
      : '';
    const timeLabel = booking.time?.replace(':', 'h') ?? '';

    const PAYMENT_LABELS: Record<string, string> = {
      now_mobile_money: 'Payé via Mobile Money (MTN)',
      now_orange_money: 'Payé via Orange Money',
      now_card:         'Payé par carte bancaire',
      later:            'Paiement à la consultation',
    };
    const key = booking.paymentMethod === 'later'
      ? 'later'
      : `now_${booking.paymentProvider}`;

    router.push({
      pathname: '/(main)/booking/booking-success',
      params: {
        appointmentId: String(appointmentId),
        doctorName:   provider.name,
        specialty:    provider.specialty,
        avatarUri:    provider.avatarUri,
        date:         dateLabel,
        time:         timeLabel,
        paymentLabel: PAYMENT_LABELS[key],
        location:     provider.location,
      },
    } as never);
  }, [booking, provider, router]);

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
      return;
    }

    if (!booking.date || !booking.time) return;

    setIsSubmitting(true);
    try {
      const appointment = await appointmentService.create({
        providerId: provider.id ?? 0,
        date: booking.date.toISOString().split('T')[0],
        time: booking.time,
        reason: booking.reason || 'Consultation générale',
        paymentMethod: booking.paymentMethod === 'now' ? booking.paymentProvider : 'later',
      });
      createdAppointmentId.current = appointment.id;
      setIsSubmitting(false);

      if (booking.paymentMethod === 'later') {
        navigateToSuccess(appointment.id);
      } else {
        if (booking.paymentProvider === 'mobile_money') momoSheetRef.current?.open();
        else if (booking.paymentProvider === 'orange_money') orangeSheetRef.current?.open();
        else cardSheetRef.current?.open();
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Erreur', err?.message || 'Impossible de créer le rendez-vous.');
    }
  };

  const handlePaymentSuccess = useCallback(() => {
    if (createdAppointmentId.current) {
      navigateToSuccess(createdAppointmentId.current);
    }
  }, [navigateToSuccess]);

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
    else router.back();
  };

  // Computed total (same formula as StepConfirm)
  const paymentTotal = (() => {
    const fee      = provider.priceXCFA;
    const discount = Math.round(fee * 0.03);
    const taxes    = Math.round(fee * 0.02);
    return fee - discount + taxes;
  })();

  const isLastStep = step === TOTAL_STEPS;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerBack}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        {!isLastStep && (
          <Text style={styles.headerTitle}>Nouvelle réservation</Text>
        )}
        {isLastStep
          ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBack}
              activeOpacity={1}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
          )
          : <View style={styles.headerSpacer} />
        }
      </View>

      {/* ── Progress ────────────────────────────────────────────────────────── */}
      {!isLastStep && <ProgressBar step={step} total={TOTAL_STEPS} />}

      {/* ── Provider card (steps 1–3 only; step 4 renders it inside StepConfirm) ── */}
      {!isLastStep && (
        <View style={styles.providerCard}>
          <Image source={{ uri: provider.avatarUri }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.providerSpecialty}>{provider.specialty}</Text>
          </View>
        </View>
      )}

      {/* ── Date preview (step 1 only, when a date has been selected) ──────── */}
      {step === 1 && booking.date !== null && (
        <View style={styles.datePreview}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.datePreviewText}>
            {booking.date.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
      )}

      {/* ── Step content ───────────────────────────────────────────────────── */}
      <View style={styles.stepContent}>
        {step === 1 && (
          <StepDate
            selected={booking.date}
            onSelect={d => patchBooking({ date: d })}
          />
        )}
        {step === 2 && (
          <StepTime
            slots={slotsLoading ? [] : availableSlots}
            selected={booking.time}
            onSelect={t => patchBooking({ time: t })}
          />
        )}
        {step === 3 && (
          <StepReason
            value={booking.reason}
            onChange={t => patchBooking({ reason: t })}
          />
        )}
        {step === 4 && (
          <StepConfirm
            provider={provider}
            booking={booking}
            onChangeDate={() => setStep(1)}
            onChange={patchBooking}
          />
        )}
      </View>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        {step > 1 && !isLastStep && (
          <TouchableOpacity onPress={handleBack} style={styles.footerBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
            <Text style={styles.footerBackText}>Retour</Text>
          </TouchableOpacity>
        )}
        <PrimaryButton
          label={isLastStep
            ? (isSubmitting ? 'Création en cours...' : 'Confirmer la réservation')
            : 'Continuer'}
          variant="solid"
          size="md"
          fullWidth={step === 1 || isLastStep}
          onPress={handleNext}
          isDisabled={!canContinue() || isSubmitting}
        />
      </View>

      {isLastStep && (
        <Text style={styles.terms}>
          En confirmant, j'ai lu et approuvé les{' '}
          <Text style={styles.termsLink}>Termes de Réservation.</Text>
        </Text>
      )}

      {/* ── Payment sheets ──────────────────────────────────────────────────── */}
      <MomoPaymentSheet
        ref={momoSheetRef}
        appointmentId={createdAppointmentId.current ?? 0}
        amount={paymentTotal}
        onSuccess={handlePaymentSuccess}
      />
      <OrangePaymentSheet
        ref={orangeSheetRef}
        appointmentId={createdAppointmentId.current ?? 0}
        amount={paymentTotal}
        onSuccess={handlePaymentSuccess}
      />
      <CardPaymentSheet
        ref={cardSheetRef}
        appointmentId={createdAppointmentId.current ?? 0}
        amount={paymentTotal}
        onSuccess={handlePaymentSuccess}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },

  // ── Provider card ──
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
  },
  providerName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  providerSpecialty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },

  // ── Date preview ──
  datePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '08',
  },
  datePreviewText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    textTransform: 'capitalize',
  },

  // ── Step content ──
  stepContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  footerBack: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  footerBackText: {
    fontSize: fontSize.md,
    color: colors.ink,
    fontFamily: fontFamily.medium,
  },

  // ── Terms ──
  terms: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
});
