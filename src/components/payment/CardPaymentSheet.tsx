import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppBottomSheet, AppBottomSheetRef } from '../generics/AppBottomSheet';
import { PhoneInput } from '../inputs/PhoneInput';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { PaymentResultModal } from './PaymentResultModal';
import { colors, fontFamily, fontSize } from '../../themes';
import { paymentService } from '../../services/payment.service';
import type { PaymentSheetRef } from './MomoPaymentSheet';

// ─── Types ────────────────────────────────────────────────────────────────────

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

/** Formats raw digits into "XXXX XXXX XXXX XXXX" */
const formatCardNumber = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

/** Formats raw digits into "MM/YY" */
const formatExpiry = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

// ─── Inline field component ───────────────────────────────────────────────────

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'number-pad';
  maxLength?: number;
  secureTextEntry?: boolean;
  flex?: number;
};

function CardField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
  secureTextEntry,
  flex,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, flex ? { flex } : undefined]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldInput, focused && styles.fieldInputFocused]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.textInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CardPaymentSheet = forwardRef<PaymentSheetRef, Props>(
  ({ appointmentId, amount, onSuccess }, ref) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [cardNumber,   setCardNumber]   = useState('');
    const [expiry,       setExpiry]       = useState('');
    const [cvv,          setCvv]          = useState('');
    const [cardHolder,   setCardHolder]   = useState('');
    const [phone,        setPhone]        = useState('');
    const [processing,   setProcessing]   = useState(false);
    const [modal,        setModal]        = useState<ModalState>({ visible: false });

    useImperativeHandle(ref, () => ({
      open:  () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    const handleCardNumberChange = (t: string) => setCardNumber(formatCardNumber(t));
    const handleExpiryChange     = (t: string) => setExpiry(formatExpiry(t));
    const handleCvvChange        = (t: string) => setCvv(t.replace(/\D/g, '').slice(0, 3));

    const reset = () => {
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setCardHolder('');
      setPhone('');
      setModal({ visible: false });
    };

    const handlePay = async () => {
      setProcessing(true);
      try {
        const result = await paymentService.initiatePayment({
          appointmentId,
          amount,
          paymentMethod: 'CARD_VISA',
          phoneNumber: phone,
        });
        setProcessing(false);
        if (result.paymentStatus === 'SUCCESS' || result.paymentStatus === 'PROCESSING') {
          setModal({ visible: true, type: 'success' });
        } else {
          setModal({
            visible: true,
            type: 'error',
            message: result.failureReason || 'Carte refusée. Vérifiez les informations et réessayez.',
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

    const rawDigits    = cardNumber.replace(/\D/g, '');
    const expiryValid  = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
    const phoneValid   = phone.replace(/\D/g, '').length >= 9;
    const isValid      = rawDigits.length === 16 && expiryValid && cvv.length === 3 && cardHolder.trim().length > 2 && phoneValid;

    return (
      <>
        <AppBottomSheet
          ref={sheetRef}
          scrollable
          onClose={reset}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.cardIconRing}>
              <Ionicons name="card-outline" size={32} color={colors.ink} />
            </View>
            <Text style={styles.title}>Paiement par carte</Text>
            <Text style={styles.subtitle}>Carte bancaire sécurisée</Text>
          </View>

          {/* ── Amount pill ── */}
          <View style={styles.amountPill}>
            <Text style={styles.amountLabel}>Montant à payer</Text>
            <Text style={styles.amountValue}>{fmt(amount)}</Text>
          </View>

          {/* ── Card number ── */}
          <CardField
            label="Numéro de carte"
            value={cardNumber}
            onChangeText={handleCardNumberChange}
            placeholder="XXXX XXXX XXXX XXXX"
            keyboardType="number-pad"
            maxLength={19}
          />

          {/* ── Expiry + CVV row ── */}
          <View style={styles.row}>
            <CardField
              label="Expiration"
              value={expiry}
              onChangeText={handleExpiryChange}
              placeholder="MM/AA"
              keyboardType="number-pad"
              maxLength={5}
              flex={1}
            />
            <CardField
              label="CVV"
              value={cvv}
              onChangeText={handleCvvChange}
              placeholder="•••"
              keyboardType="number-pad"
              maxLength={3}
              secureTextEntry
              flex={1}
            />
          </View>

          {/* ── Cardholder name ── */}
          <CardField
            label="Nom sur la carte"
            value={cardHolder}
            onChangeText={setCardHolder}
            placeholder="PRÉNOM NOM"
          />

          {/* ── Phone (required by backend) ── */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Téléphone de contact</Text>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              placeholder="6XX XXX XXX"
            />
          </View>

          {/* ── Security badge ── */}
          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.inkMuted} />
            <Text style={styles.securityText}>
              Paiement sécurisé SSL 256-bit. Vos données ne sont jamais stockées.
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

CardPaymentSheet.displayName = 'CardPaymentSheet';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
    gap: 6,
  },
  cardIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },

  amountPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
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

  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    gap: 8,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginLeft: 4,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 16 : 13,
    backgroundColor: colors.surface,
  },
  fieldInputFocused: {
    borderColor: colors.ink,
  },
  textInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    padding: 0,
  },

  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  securityText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    lineHeight: 16,
  },
  buttonWrap: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
});
