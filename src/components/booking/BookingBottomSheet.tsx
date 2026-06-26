import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppBottomSheet, AppBottomSheetRef } from "../generics";
import { PrimaryButton } from "../buttons";
import { colors, fontFamily, fontSize } from "../../themes";

import { ProgressBar } from "./ProgressBar";
import { StepDate } from "./StepDate";
import { StepTime } from "./StepTime";
import { StepReason } from "./StepReason";
import { StepConfirm } from "./StepConfirm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingData = {
  date: Date | null;
  time: string | null;
  reason: string;
  paymentMethod: "now" | "later";
  paymentProvider: "mobile_money" | "orange_money" | "card";
};

type Provider = {
  name: string;
  specialty: string;
  avatarUri: string;
  priceXCFA: number;
  location: string;
};

export type BookingBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  provider?: Provider;
  onClose?: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const DEFAULT_PROVIDER: Provider = {
  name: "Dr. Igriss Kakmo",
  specialty: "Gynécologue",
  avatarUri: "https://randomuser.me/api/portraits/men/75.jpg",
  priceXCFA: 5000,
  location: "Clinique Wellstar, Bastos, Yaoundé",
};

const DEFAULT_BOOKING: BookingData = {
  date: null,
  time: "08:00",
  reason: "",
  paymentMethod: "now",
  paymentProvider: "mobile_money",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProviderCard = ({ provider }: { provider: Provider }) => (
  <View style={styles.providerCard}>
    <Image source={{ uri: provider.avatarUri }} style={styles.providerAvatar} />
    <View style={{ flex: 1 }}>
      <Text style={styles.providerName}>{provider.name}</Text>
      <Text style={styles.providerSpecialty}>{provider.specialty}</Text>
    </View>
  </View>
);

const DatePreview = ({ date }: { date: Date }) => (
  <View style={styles.datePreview}>
    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
    <Text style={styles.datePreviewText}>
      {date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
    </Text>
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const BookingBottomSheet = forwardRef<BookingBottomSheetRef, Props>(
  ({ provider = DEFAULT_PROVIDER, onClose }, ref) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [booking, setBooking] = useState<BookingData>(DEFAULT_BOOKING);

    const patchBooking = useCallback((patch: Partial<BookingData>) => {
      setBooking((prev) => ({ ...prev, ...patch }));
    }, []);

    useImperativeHandle(ref, () => ({
      open: () => {
        setStep(1);
        setBooking(DEFAULT_BOOKING);
        sheetRef.current?.open();
      },
      close: () => sheetRef.current?.close(),
    }));

    const handleClose = () => {
      sheetRef.current?.close();
      onClose?.();
    };

    const canContinue = () => {
      if (step === 1) return booking.date !== null;
      if (step === 2) return booking.time !== null;
      return true;
    };

    const handleNext = () => {
      if (step < TOTAL_STEPS) {
        const next = step + 1;
        setStep(next);
        if (next === TOTAL_STEPS) sheetRef.current?.expand();
      } else {
        sheetRef.current?.close();
        router.push("/(main)/booking/booking-success" as never);
      }
    };

    const handleBack = () => {
      if (step > 1) setStep((s) => s - 1);
      else handleClose();
    };

    const isLastStep = step === TOTAL_STEPS;

    return (
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={["70%", "92%"]}
        onClose={onClose}
        scrollable={false}
        containerStyle={styles.sheet}
      >
        <View style={styles.topBar}>
          <Text style={styles.title}>Nouvelle réservation</Text>
        </View>

        <ProgressBar step={step} total={TOTAL_STEPS} />

        <ProviderCard provider={provider} />

        {step === 1 && booking.date && <DatePreview date={booking.date} />}

        <View style={styles.stepContent}>
          {step === 1 && (
            <StepDate
              selected={booking.date}
              onSelect={(d) => patchBooking({ date: d })}
            />
          )}
          {step === 2 && (
            <StepTime
              selected={booking.time}
              onSelect={(t) => patchBooking({ time: t })}
            />
          )}
          {step === 3 && (
            <StepReason
              value={booking.reason}
              onChange={(t) => patchBooking({ reason: t })}
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

        <View style={styles.footer}>
          {step > 1 && !isLastStep && (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={colors.ink} />
              <Text style={styles.backText}>Retour</Text>
            </TouchableOpacity>
          )}
          <PrimaryButton
            label={isLastStep ? "Confirmer la réservation" : "Continuer"}
            variant="solid"
            size="md"
            fullWidth={step === 1 || isLastStep}
            onPress={handleNext}
            isDisabled={!canContinue()}
          />
        </View>

        {isLastStep && (
          <Text style={styles.termsFooter}>
            En confirmant, j'accepte les{" "}
            <Text style={styles.termsLink}>Termes de Réservation.</Text>
          </Text>
        )}
      </AppBottomSheet>
    );
  },
);

BookingBottomSheet.displayName = "BookingBottomSheet";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  backBtn: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
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
  providerAvatar: {
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
  datePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary + "40",
    backgroundColor: colors.primary + "08",
  },
  datePreviewText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    textTransform: "capitalize",
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.ink,
    fontFamily: fontFamily.medium,
  },
  termsFooter: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    textAlign: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
});
