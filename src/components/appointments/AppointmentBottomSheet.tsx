import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { AppBottomSheet, AppBottomSheetRef } from '../generics';
import { PrimaryButton } from '../buttons';
import { GrayButton } from '../buttons/GrayButton';
import { colors, fontFamily, fontSize } from '../../themes';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentStatus = 'confirmed' | 'pending' | 'paid' | 'cancelled';

type InvoiceLine = {
  label: string;
  amount: number;
  isDiscount?: boolean;
};

export type AppointmentSheetData = {
  id: string | number;
  title: string;
  doctorName: string;
  doctorAvatarUri: string;
  specialty: string;
  status: AppointmentStatus;
  reason: string;
  dateTime: string;
  clinicName: string;
  locationSuffix: string;
  clinicImageUri?: string;
  paymentMethod: string;
  invoiceLines: InvoiceLine[];
  total: number;
  currency?: string;
};

type Appointment = AppointmentSheetData;

export type AppointmentDetailBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type ActionVariant = 'reschedule' | 'book_again';

type Props = {
  appointment?: Appointment;
  actionVariant?: ActionVariant;
  onReschedule?: () => void;
  onCancel?: () => void;
  onBookAgain?: () => void;
  onDownload?: () => void;
  onShowOnMap?: () => void;
  onDoctorPress?: () => void;
  onClose?: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_APPOINTMENT: Appointment = {
  id: 0,
  title: 'Visite 002',
  doctorName: 'Dr. Igriss Kakmo',
  doctorAvatarUri: 'https://randomuser.me/api/portraits/men/75.jpg',
  specialty: 'Gynécologue',
  status: 'confirmed',
  reason: 'Démangeaison récurrente au niveau des parties génitales.',
  dateTime: '25 Mars 2026 de 12:00 à 13:00',
  clinicName: 'Clinique Wellstar',
  locationSuffix: 'situé à Bastos, Yaoundé',
  clinicImageUri:
    'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600',
  paymentMethod: 'Payer à la consultation',
  invoiceLines: [
    { label: 'Consultation',    amount: 5000 },
    { label: 'Paiement In-app', amount: -150, isDiscount: true },
    { label: 'Prix Estimé',     amount: 5000 },
    { label: 'Taxes',           amount: 100 },
  ],
  total: 4950,
  currency: 'XCFA',
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; color: string }> = {
  confirmed: { label: 'Confirmé',   bg: '#E8FFF0', color: '#1A7F3C' },
  pending:   { label: 'En attente', bg: '#FFF8ED', color: '#B45309' },
  paid:      { label: 'Payé',       bg: '#E8FFF0', color: '#1A7F3C' },
  cancelled: { label: 'Annulé',     bg: '#FFF0F0', color: '#B91C1C' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (n: number): string =>
  Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Builds a styled HTML ticket ready for PDF rendering via expo-print. */
function buildTicketHTML(appt: Appointment, currency: string): string {
  const statusCfg   = STATUS_CONFIG[appt.status];
  const invoiceRows = appt.invoiceLines
    .map(l => {
      const sign   = l.isDiscount ? '-' : '';
      const amount = `${sign}${formatPrice(l.amount)}&nbsp;${currency}`;
      const style  = l.isDiscount ? 'color:#00C853;font-weight:600;' : '';
      return `
        <tr>
          <td style="padding:6px 0;color:#64748B;font-size:13px;">${l.label}</td>
          <td style="padding:6px 0;text-align:right;font-size:13px;${style}">${amount}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#F1F5F9;padding:24px;}
    .ticket{
      max-width:400px;margin:0 auto;
      background:#FFFFFF;border-radius:24px;
      overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.10);
    }
    .header{
      background:linear-gradient(135deg,#43F04A 0%,#2ADB6F 40%,#11C793 100%);
      padding:28px 24px 24px;color:#fff;
    }
    .logo{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:.85;}
    .visit-title{font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-top:8px;}
    .status-pill{
      display:inline-flex;align-items:center;gap:6px;
      background:rgba(255,255,255,.25);border-radius:999px;
      padding:5px 14px;font-size:12px;font-weight:600;margin-top:12px;
    }
    .status-dot{width:7px;height:7px;border-radius:50%;background:#fff;display:inline-block;}
    .total-row{
      display:flex;justify-content:space-between;align-items:flex-end;
      margin-top:16px;
    }
    .total-label{font-size:11px;opacity:.75;}
    .total-amount{font-size:22px;font-weight:800;letter-spacing:-0.3px;}
    .doctor{
      display:flex;align-items:center;gap:14px;
      padding:18px 24px;border-bottom:1px solid #F1F5F9;
    }
    .doctor-avatar{
      width:52px;height:52px;border-radius:26px;
      background:#E2E8F0;border:2px solid #F1F5F9;
      object-fit:cover;
    }
    .doctor-name{font-size:15px;font-weight:700;color:#1B181B;}
    .doctor-specialty{font-size:13px;color:#8896B0;margin-top:3px;}
    .perf{
      display:flex;align-items:center;
      padding:0;margin:0;height:24px;overflow:hidden;
    }
    .perf-circle{
      width:24px;height:24px;border-radius:50%;
      background:#F1F5F9;flex-shrink:0;margin:-12px;
    }
    .perf-line{
      flex:1;border-top:2px dashed #E2E8F0;margin:0 12px;
    }
    .details{padding:20px 24px 8px;}
    .detail-item{margin-bottom:16px;}
    .detail-label{
      font-size:10px;font-weight:600;color:#94A3B8;
      text-transform:uppercase;letter-spacing:0.7px;margin-bottom:5px;
    }
    .detail-value{font-size:14px;font-weight:500;color:#1B181B;line-height:1.5;}
    .invoice{
      background:#F8FAFC;margin:4px 16px 16px;
      border-radius:16px;padding:18px;
    }
    .invoice-title{
      font-size:10px;font-weight:700;color:#94A3B8;
      text-transform:uppercase;letter-spacing:0.7px;margin-bottom:12px;
    }
    table{width:100%;border-collapse:collapse;}
    .total-sep{height:1px;background:#E2E8F0;margin:10px 0;}
    .total-tr td{padding:8px 0;font-size:16px;font-weight:800;}
    .total-tr .td-label{color:#1B181B;}
    .total-tr .td-amount{color:#11C793;text-align:right;}
    .footer{
      text-align:center;padding:16px 24px;
      font-size:11px;color:#94A3B8;
      border-top:1px solid #F1F5F9;line-height:1.7;
    }
    .footer strong{color:#11C793;}
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="logo">VitaCare</div>
      <div class="visit-title">${appt.title}</div>
      <div class="status-pill">
        <span class="status-dot" style="background:${statusCfg.color};"></span>
        ${statusCfg.label}
      </div>
      <div class="total-row">
        <div>
          <div class="total-label">Total estimé</div>
          <div class="total-amount">${formatPrice(appt.total)}&nbsp;${currency}</div>
        </div>
      </div>
    </div>
    <div class="doctor">
      <img class="doctor-avatar" src="${appt.doctorAvatarUri}" alt="avatar"/>
      <div>
        <div class="doctor-name">${appt.doctorName}</div>
        <div class="doctor-specialty">${appt.specialty}</div>
      </div>
    </div>
    <div class="perf">
      <div class="perf-circle"></div>
      <div class="perf-line"></div>
      <div class="perf-circle"></div>
    </div>
    <div class="details">
      <div class="detail-item">
        <div class="detail-label">📝 Motif</div>
        <div class="detail-value">${appt.reason}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">📅 Date &amp; Heure</div>
        <div class="detail-value">${appt.dateTime}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">📍 Lieu</div>
        <div class="detail-value"><strong>${appt.clinicName}</strong> ${appt.locationSuffix}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">💳 Méthode de paiement</div>
        <div class="detail-value">${appt.paymentMethod}</div>
      </div>
    </div>
    <div class="invoice">
      <div class="invoice-title">Facture</div>
      <table>
        <tbody>
          ${invoiceRows}
          <tr><td colspan="2"><div class="total-sep"></div></td></tr>
          <tr class="total-tr">
            <td class="td-label">Total</td>
            <td class="td-amount">${formatPrice(appt.total)}&nbsp;${currency}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="footer">
      <strong>VitaCare</strong> — Santé Intelligente au Cameroun<br/>
      Généré le ${new Date().toLocaleDateString('fr-FR')}<br/>
      Ce ticket fait foi pour votre rendez-vous médical.
    </div>
  </div>
</body>
</html>`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Divider = () => <View style={styles.divider} />;

const SectionTitle = ({ children }: { children: string }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

const InfoRow = ({
  icon,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color={colors.ink} />
    <View style={styles.infoRowContent}>{children}</View>
  </View>
);

const PaymentRow = ({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) => (
  <View style={styles.paymentMethod}>
    <Ionicons name={icon} size={22} color={colors.ink} />
    <Text style={styles.paymentMethodText}>{label}</Text>
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const AppointmentDetailBottomSheet = forwardRef<AppointmentDetailBottomSheetRef, Props>(
  (
    {
      appointment = DEFAULT_APPOINTMENT,
      actionVariant = 'reschedule',
      onReschedule,
      onCancel,
      onBookAgain,
      onDownload,
      onShowOnMap,
      onDoctorPress,
      onClose,
    },
    ref,
  ) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);

    useImperativeHandle(ref, () => ({
      open:  () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    const currency   = appointment.currency ?? 'XCFA';
    const fmt        = (n: number) => `${formatPrice(n)} ${currency}`;
    const statusCfg  = STATUS_CONFIG[appointment.status];

    const handleReschedule = () => {
      sheetRef.current?.close();
      onReschedule?.();
    };

    const handleCancel = () => {
      Alert.alert(
        'Annuler le rendez-vous',
        'Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.',
        [
          { text: 'Garder le RDV', style: 'cancel' },
          {
            text: 'Confirmer l\'annulation',
            style: 'destructive',
            onPress: () => {
              sheetRef.current?.close();
              onCancel?.();
            },
          },
        ],
      );
    };

    const handleBookAgain = () => {
      sheetRef.current?.close();
      onBookAgain?.();
    };

    const handleShowOnMap = () => {
      sheetRef.current?.close();
      onShowOnMap?.();
    };

    const handleDownload = async () => {
      try {
        const html = buildTicketHTML(appointment, currency);
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Ticket — ${appointment.title}`,
            UTI: 'com.adobe.pdf',
          });
        }
        onDownload?.();
      } catch {
        Alert.alert('Erreur', 'Impossible de générer le ticket PDF.');
      }
    };

    return (
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={['60%', '95%']}
        onClose={onClose}
        scrollable
        containerStyle={styles.sheet}
      >
        <Text style={styles.visitTitle}>{appointment.title}</Text>

        <View style={styles.doctorStatusCard}>
          <TouchableOpacity
            style={styles.doctorRow}
            onPress={onDoctorPress}
            activeOpacity={0.75}
          >
            <Image
              source={{ uri: appointment.doctorAvatarUri }}
              style={styles.avatar}
            />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{appointment.doctorName}</Text>
              <Text style={styles.specialty}>{appointment.specialty}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          <View style={styles.statusTotalRow}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
              <Text style={[styles.statusLabel, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>

            <View style={styles.totalBlock}>
              <Text style={styles.totalCaption}>Total estimé</Text>
              <Text style={styles.totalValue}>{fmt(appointment.total)}</Text>
            </View>
          </View>
        </View>

        <SectionTitle>Motif</SectionTitle>
        <Text style={styles.bodyText}>{appointment.reason}</Text>

        <SectionTitle>Date & Heure</SectionTitle>
        <InfoRow icon="calendar-outline">
          <Text style={styles.bodyText}>{appointment.dateTime}</Text>
        </InfoRow>

        <SectionTitle>Lieux</SectionTitle>
        <InfoRow icon="location-outline">
          <Text style={styles.bodyText}>
            <Text style={styles.boldInline}>{appointment.clinicName}</Text>
            {` ${appointment.locationSuffix}`}
          </Text>
        </InfoRow>

        {appointment.clinicImageUri ? (
          <Image
            source={{ uri: appointment.clinicImageUri }}
            style={styles.clinicImage}
            resizeMode="cover"
          />
        ) : null}

        <GrayButton
          label="Montrer sur la Carte"
          icon="map-outline"
          onPress={handleShowOnMap}
          style={styles.mapBtn}
        />

        <SectionTitle>Méthodes de paiements</SectionTitle>

        {appointment.paymentMethod === 'Espèces' ? (
          <PaymentRow icon="cash-outline" label={appointment.paymentMethod} />
        ) : (
          <PaymentRow icon="card-outline" label={appointment.paymentMethod} />
        )}

        <SectionTitle>Facture</SectionTitle>

        {appointment.invoiceLines.map((line) => (
          <View key={line.label} style={styles.invoiceLine}>
            <Text style={styles.invoiceLabel}>{line.label}</Text>
            <Text
              style={[
                styles.invoiceAmount,
                line.isDiscount && styles.invoiceAmountDiscount,
              ]}
            >
              {line.isDiscount
                ? `-${formatPrice(line.amount)} ${currency}`
                : fmt(line.amount)}
            </Text>
          </View>
        ))}

        <View style={styles.totalLine}>
          <Text style={styles.totalLineLabel}>Total</Text>
          <Text style={styles.totalLineAmount}>{fmt(appointment.total)}</Text>
        </View>

        <View style={styles.actionsRow}>
          {actionVariant === 'reschedule' ? (
            <>
              <PrimaryButton
                label="Réprogrammer"
                variant="solid"
                size="md"
                onPress={handleReschedule}
              />
              <GrayButton
                label="Annuler"
                onPress={handleCancel}
                style={{ flex: 0.75 }}
              />
            </>
          ) : (
            <PrimaryButton
              label="Réserver à nouveau"
              variant="solid"
              fullWidth
              size="md"
              onPress={handleBookAgain}
              style={{ flex: 0.95 }}
            />
          )}

          <GrayButton
            label=""
            icon="download-outline"
            onPress={handleDownload}
            style={styles.downloadBtn}
          />
        </View>
      </AppBottomSheet>
    );
  },
);

AppointmentDetailBottomSheet.displayName = 'AppointmentDetailBottomSheet';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 20,
  },
  visitTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.ink,
    marginTop: 4,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  doctorStatusCard: {
    backgroundColor: colors.ltsurface,
    borderRadius: 16,
    padding: 16,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.border,
  },
  doctorInfo: {
    flex: 1,
    gap: 3,
  },
  doctorName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  specialty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
  statusTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  totalBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  totalCaption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  totalValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  paymentMethod: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  paymentMethodText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
    textTransform: 'capitalize',
    marginTop: 20,
    marginBottom: 10,
  },
  bodyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  boldInline: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 6,
  },
  infoRowContent: {
    flex: 1,
  },
  clinicImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginTop: 14,
    backgroundColor: colors.border,
  },
  mapBtn: {
    marginTop: 12,
    borderRadius: 12,
  },
  invoiceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  invoiceLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  invoiceAmount: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  invoiceAmountDiscount: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLineLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  totalLineAmount: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 8,
  },
  downloadBtn: {
    width: 50,
    height: 50,
    borderRadius: 999,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});
