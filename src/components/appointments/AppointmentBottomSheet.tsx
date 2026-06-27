import React, { forwardRef, useImperativeHandle, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppBottomSheet, AppBottomSheetRef } from "../generics";
import { PrimaryButton } from "../buttons";
import { GrayButton } from "../buttons/GrayButton";
import { colors, fontFamily, fontSize } from "../../themes";
import { AppointmentStatus } from "../../types/api-responses";
import { Appointment } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentDetailBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type ActionVariant = "reschedule" | "book_again";

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

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; bg: string; color: string }
> = {
  CONFIRMED: { label: "Confirmé", bg: "#E8FFF0", color: "#1A7F3C" },
  PENDING: { label: "En attente", bg: "#FFF8ED", color: "#B45309" },
  PAID: { label: "Payé", bg: "#E8FFF0", color: "#1A7F3C" },
  CANCELLED: { label: "Annulé", bg: "#FFF0F0", color: "#B91C1C" },
  NO_SHOW: { label: "Non présenté", bg: "#FFF0F0", color: "#B91C1C" },
  IN_PROGRESS: { label: "En cours", bg: "#FFF0F0", color: "#B91C1C" },
  RESCHEDULED: { label: "Reporté", bg: "#FFF0F0", color: "#B91C1C" },
  COMPLETED: { label: "Terminé", bg: "#FFF0F0", color: "#1A7F3C" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (n: number): string =>
  Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

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

export const AppointmentDetailBottomSheet = forwardRef<
  AppointmentDetailBottomSheetRef,
  Props
>(
  (
    {
      appointment,
      actionVariant = "reschedule",
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
      open: () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    if (!appointment) return null;

    const currency = appointment.currency ?? "XCFA";
    const fmt = (n: number) => `${formatPrice(n)} ${currency}`;
    const statusCfg = STATUS_CONFIG[appointment.status];

    const handleReschedule = () => {
      sheetRef.current?.close();
      onReschedule?.();
    };

    const handleCancel = () => {
      Alert.alert(
        "Annuler le rendez-vous",
        "Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.",
        [
          { text: "Garder le RDV", style: "cancel" },
          {
            text: "Confirmer l'annulation",
            style: "destructive",
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
        // TODO : Implement PDF Ticket Generation
        Alert.alert("Succès", "Ticket généré avec succès");
      } catch {
        Alert.alert("Erreur", "Impossible de générer le ticket PDF.");
      }
    };

    return (
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={["60%", "95%"]}
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
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.inkMuted}
            />
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          <View style={styles.statusTotalRow}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusCfg.color }]}
              />
              <Text style={[styles.statusLabel, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>

            <View style={styles.totalBlock}>
              <Text style={styles.totalCaption}>Total estimé</Text>
              <Text style={styles.totalValue}>
                {fmt(appointment.total || 0)}
              </Text>
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
            <Text style={styles.boldInline}>{appointment.clinic}</Text>
            {` ${appointment.address}`}
          </Text>
        </InfoRow>

        {appointment.avatarUri ? (
          <Image
            source={{ uri: appointment.avatarUri }}
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

        {appointment.paymentMethod === "Espèces" ? (
          <PaymentRow icon="cash-outline" label={appointment.paymentMethod} />
        ) : (
          <PaymentRow icon="card-outline" label={appointment.paymentMethod} />
        )}

        <SectionTitle>Facture</SectionTitle>

        {appointment.invoiceLines?.map((line) => (
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
          <Text style={styles.totalLineAmount}>
            {fmt(appointment.total || 0)}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {actionVariant === "reschedule" ? (
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

AppointmentDetailBottomSheet.displayName = "AppointmentDetailBottomSheet";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 20,
  },
  visitTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
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
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "flex-end",
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
    flexDirection: "row",
    alignItems: "center",
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
    textTransform: "capitalize",
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginVertical: 6,
  },
  infoRowContent: {
    flex: 1,
  },
  clinicImage: {
    width: "100%",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
