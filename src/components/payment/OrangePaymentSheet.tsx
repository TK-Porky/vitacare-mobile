import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { View, Text, StyleSheet, Image, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import {
  AppBottomSheet,
  AppBottomSheetRef,
} from "@/components/generics/AppBottomSheet";
import { PhoneInput } from "@/components/inputs/PhoneInput";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { PaymentResultModal } from "@/components/payment/PaymentResultModal";
import { colors, fontFamily, fontSize } from "@/themes";
import { paymentService } from "@/services/payment.service";
import type { PaymentSheetRef } from "@/components/payment/MomoPaymentSheet";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  appointmentId: number;
  amount: number;
  onSuccess: () => void;
};

type ModalState =
  | { visible: false }
  | { visible: true; type: "success" }
  | { visible: true; type: "error"; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `${Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XCFA`;

const formatPhone = (phone: string) => phone.replace(/\s/g, "");

// ─── Component ────────────────────────────────────────────────────────────────

export const OrangePaymentSheet = forwardRef<PaymentSheetRef, Props>(
  ({ appointmentId, amount, onSuccess }, ref) => {
    const { t } = useTranslation();
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [phone, setPhone] = useState("");
    const [processing, setProcessing] = useState(false);
    const [modal, setModal] = useState<ModalState>({ visible: false });

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    const handlePay = async () => {
      setProcessing(true);
      try {
        const result = await paymentService.initiatePayment({
          appointmentId,
          amount,
          paymentMethod: "ORANGE_MONEY_CM",
          phoneNumber: formatPhone(phone),
        });
        setProcessing(false);
        if (
          result.paymentStatus === "SUCCESS" ||
          result.paymentStatus === "PROCESSING"
        ) {
          setModal({ visible: true, type: "success" });
        } else {
          setModal({
            visible: true,
            type: "error",
            message:
              result.failureReason || t('errors.somethingWrong'),
          });
        }
      } catch (err: any) {
        setProcessing(false);
        setModal({
          visible: true,
          type: "error",
          message: err?.message || t('errors.somethingWrong'),
        });
      }
    };

    const handlePrimary = () => {
      if (modal.visible && modal.type === "success") {
        setModal({ visible: false });
        sheetRef.current?.close();
        onSuccess();
      } else {
        setModal({ visible: false });
      }
    };

    const handleSecondary = () => {
      setModal({ visible: false });
      sheetRef.current?.close();
    };

    const isValid = phone.replace(/\D/g, "").length >= 9;

    return (
      <>
        <AppBottomSheet
          ref={sheetRef}
          scrollable
          onClose={() => {
            setPhone("");
            setModal({ visible: false });
          }}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Image
              source={require("@assets/images/icons/OMIcon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t('booking.payNow')}</Text>
            <Text style={styles.subtitle}>Orange Money Cameroun</Text>
          </View>

          {/* ── Amount pill ── */}
          <View style={styles.amountPill}>
            <Text style={styles.amountLabel}>{t('booking.payment')}</Text>
            <Text style={styles.amountValue}>{fmt(amount)}</Text>
          </View>

          {/* ── Phone field ── */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {t('common.phone')}
            </Text>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              placeholder="6XX XXX XXX"
            />
          </View>

          {/* ── USSD notice ── */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              {t('booking.payNow')}
            </Text>
          </View>

          {/* ── Pay button ── */}
          <View style={styles.buttonWrap}>
            <PrimaryButton
              label={
                processing ? t('common.loading') : `${t('booking.payNow')} ${fmt(amount)}`
              }
              fullWidth
              isLoading={processing}
              isDisabled={!isValid || processing}
              onPress={handlePay}
            />
          </View>
        </AppBottomSheet>

        <PaymentResultModal
          visible={modal.visible}
          type={modal.visible ? modal.type : "success"}
          amount={amount}
          errorMessage={
            modal.visible && modal.type === "error" ? modal.message : undefined
          }
          onPrimary={handlePrimary}
          onSecondary={handleSecondary}
        />
      </>
    );
  },
);

OrangePaymentSheet.displayName = "OrangePaymentSheet";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 24,
    gap: 6,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 6,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkMuted,
  },

  amountPill: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  amountLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.inkLight,
  },
  amountValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },

  field: {
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginLeft: 4,
  },

  notice: {
    backgroundColor: "#FF690018",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    paddingHorizontal: 16,
    marginHorizontal: 20,
  },
  noticeText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    lineHeight: 18,
  },
  buttonWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
});
