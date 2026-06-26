import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { AppBottomSheet, AppBottomSheetRef } from '../generics/AppBottomSheet';
import { PhoneInput } from '../inputs/PhoneInput';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { PaymentResultModal } from './PaymentResultModal';
import { colors, fontFamily, fontSize } from '../../themes';
import { paymentService } from '../../services/payment.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  appointmentId: number;
  amount: number;
  onSuccess: () => void;
};

type ModalState =
  | { visible: false }
  | { visible: true; type: 'success' }
  | { visible: true; type: 'error'; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} XCFA`;

// ─── Component ────────────────────────────────────────────────────────────────

export const MomoPaymentSheet = forwardRef<PaymentSheetRef, Props>(
  ({ appointmentId, amount, onSuccess }, ref) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [phone, setPhone]         = useState('');
    const [processing, setProcessing] = useState(false);
    const [modal, setModal]         = useState<ModalState>({ visible: false });

    useImperativeHandle(ref, () => ({
      open:  () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    const handlePay = async () => {
      setProcessing(true);
      try {
        const result = await paymentService.initiatePayment({
          appointmentId,
          amount,
          paymentMethod: 'MTN_MOMO_CM',
          phoneNumber: phone,
        });
        setProcessing(false);
        if (result.paymentStatus === 'SUCCESS' || result.paymentStatus === 'PROCESSING') {
          setModal({ visible: true, type: 'success' });
        } else {
          setModal({
            visible: true,
            type: 'error',
            message: result.failureReason || 'Paiement refusé. Veuillez réessayer.',
          });
        }
      } catch (err: any) {
        setProcessing(false);
        setModal({
          visible: true,
          type: 'error',
          message: err?.message || 'Erreur de paiement. Veuillez réessayer.',
        });
      }
    };

    const handlePrimary = () => {
      if (modal.visible && modal.type === 'success') {
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

    const isValid = phone.replace(/\D/g, '').length >= 9;

    return (
      <>
        <AppBottomSheet
          ref={sheetRef}
          scrollable
          onClose={() => {
            setPhone('');
            setModal({ visible: false });
          }}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/MomoIcon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Paiement Mobile Money</Text>
            <Text style={styles.subtitle}>MTN Mobile Money</Text>
          </View>

          {/* ── Amount pill ── */}
          <View style={styles.amountPill}>
            <Text style={styles.amountLabel}>Montant à payer</Text>
            <Text style={styles.amountValue}>{fmt(amount)}</Text>
          </View>

          {/* ── Phone field ── */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Numéro de téléphone MoMo</Text>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              placeholder="6XX XXX XXX"
            />
          </View>

          {/* ── USSD notice ── */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Vous recevrez une demande de confirmation USSD sur le numéro renseigné. Assurez-vous d'avoir un solde suffisant.
            </Text>
          </View>

          {/* ── Pay button ── */}
          <View style={styles.buttonWrap}>
            <PrimaryButton
              label={processing ? 'Traitement en cours…' : `Payer ${fmt(amount)}`}
              fullWidth
              isLoading={processing}
              isDisabled={!isValid || processing}
              onPress={handlePay}
            />
          </View>
        </AppBottomSheet>

        <PaymentResultModal
          visible={modal.visible}
          type={modal.visible ? modal.type : 'success'}
          amount={amount}
          errorMessage={modal.visible && modal.type === 'error' ? modal.message : undefined}
          onPrimary={handlePrimary}
          onSecondary={handleSecondary}
        />
      </>
    );
  },
);

MomoPaymentSheet.displayName = 'MomoPaymentSheet';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  fieldLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
    marginLeft: 4,
  },

  notice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFCF0118',
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 4,
  },
  noticeText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    lineHeight: 18,
  },
  buttonWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
});
