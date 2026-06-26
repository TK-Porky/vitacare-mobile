import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../themes';
import { PrimaryButton } from '../buttons/PrimaryButton';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentResultType = 'success' | 'error';

type Props = {
  visible: boolean;
  type: PaymentResultType;
  amount?: number;
  errorMessage?: string;
  /** "Voir ma réservation" on success, "Réessayer" on error */
  onPrimary: () => void;
  /** "Annuler" — error only, closes sheet entirely */
  onSecondary?: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} XCFA`;

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentResultModal({
  visible,
  type,
  amount,
  errorMessage,
  onPrimary,
  onSecondary,
}: Props) {
  const isSuccess = type === 'success';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Icon */}
          <View style={[styles.iconRing, isSuccess ? styles.iconRingSuccess : styles.iconRingError]}>
            <Ionicons
              name={isSuccess ? 'checkmark' : 'close'}
              size={40}
              color={colors.white}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isSuccess ? 'Paiement réussi !' : 'Paiement échoué'}
          </Text>

          {/* Body */}
          <Text style={styles.body}>
            {isSuccess
              ? `${amount ? fmt(amount) + ' ont été débités avec succès.' : ''}\nVotre réservation est confirmée.`
              : (errorMessage ?? 'Une erreur est survenue. Veuillez vérifier vos informations et réessayer.')}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            {!isSuccess && onSecondary && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onSecondary} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            )}
            <View style={styles.primaryBtnWrap}>
              <PrimaryButton
                label={isSuccess ? 'Voir ma réservation' : 'Réessayer'}
                fullWidth
                onPress={onPrimary}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 28 : 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 0,
  },

  // Icon
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconRingSuccess: { backgroundColor: colors.primary },
  iconRingError:   { backgroundColor: colors.error },

  // Text
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.inkLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  // Buttons
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtnWrap: {
    width: '100%',
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.inkLight,
  },
});
