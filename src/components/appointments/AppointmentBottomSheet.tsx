// components/appointments/AppointmentDetailBottomSheet.tsx
import React, { forwardRef, useImperativeHandle, useRef, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/generics";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { GrayButton } from "@/components/buttons/GrayButton";
import { colors, fontFamily, fontSize } from "@/themes";
import { AppointmentStatus } from "@/types/api-responses";
import { Appointment } from "@/types";
import { parseAppointmentDate } from "@/utils/formatDate";

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
  IN_PROGRESS: { label: "En cours", bg: "#E8F0FE", color: "#1A56DB" },
  RESCHEDULED: { label: "Reporté", bg: "#FFF0F0", color: "#B91C1C" },
  COMPLETED: { label: "Terminé", bg: "#E8FFF0", color: "#1A7F3C" },
};

const DEFAULT_STATUS = {
  label: "Inconnu",
  bg: colors.surface,
  color: colors.inkLight,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ✅ Correction: Conserver le signe pour les nombres négatifs
const formatPrice = (n: number): string => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return sign + abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// ✅ Valeurs par défaut
const DEFAULT_APPOINTMENT: Partial<Appointment> = {
  title: "Rendez-vous",
  reason: "Motif non spécifié",
  doctorName: "Dr. Inconnu",
  specialty: "Spécialiste",
  clinic: "Clinique non spécifiée",
  address: "Adresse non spécifiée",
  time: "",
};

// ─── Sub-components avec memo ────────────────────────────────────────────────

const Divider = memo(() => <View style={styles.divider} />);
Divider.displayName = "Divider";

const SectionTitle = memo(({ children }: { children: string }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
));
SectionTitle.displayName = "SectionTitle";

const InfoRow = memo(
  ({
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
  ),
);
InfoRow.displayName = "InfoRow";

const PaymentRow = memo(
  ({
    icon,
    label,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }) => (
    <View style={styles.paymentMethod}>
      <Ionicons name={icon} size={22} color={colors.ink} />
      <Text style={styles.paymentMethodText}>{label || "Non spécifié"}</Text>
    </View>
  ),
);
PaymentRow.displayName = "PaymentRow";

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

    // ✅ Valeurs par défaut
    const {
      title = DEFAULT_APPOINTMENT.title,
      doctorName = DEFAULT_APPOINTMENT.doctorName,
      specialty = DEFAULT_APPOINTMENT.specialty,
      clinic = DEFAULT_APPOINTMENT.clinic,
      address = DEFAULT_APPOINTMENT.address,
      reason = DEFAULT_APPOINTMENT.reason,
      time = DEFAULT_APPOINTMENT.time,
      total = 0,
      currency = "XCFA",
      status,
      doctorAvatarUri,
      avatarUri,
      invoiceLines = [],
      paymentMethod = "Non spécifié",
    } = appointment;

    const currencySymbol = currency ?? "XCFA";
    const fmt = (n: number) => `${formatPrice(n)} ${currencySymbol}`;
    const statusCfg = STATUS_CONFIG[status] ?? DEFAULT_STATUS;
    const { day, month, year } = parseAppointmentDate(appointment.date);

    // ✅ Gestion du format de la date
    const dateString =
      day && month && year
        ? `${day} ${month} ${year}${time ? ` à ${time}` : ""}`
        : "Date non spécifiée";

    // ✅ Gestion des images
    const avatarSource =
      doctorAvatarUri || appointment.doctorAvatarUri
        ? { uri: doctorAvatarUri || appointment.doctorAvatarUri }
        : undefined;

    const clinicImageSource =
      avatarUri || appointment.avatarUri
        ? { uri: avatarUri || appointment.avatarUri }
        : undefined;

    // ✅ Handlers
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
        // TODO: Implement PDF Ticket Generation
        Alert.alert(
          "Bientôt disponible",
          "La génération de tickets PDF sera disponible prochainement.",
        );
        // Si la feature est implémentée
        if (onDownload) {
          await onDownload();
        }
      } catch (error) {
        console.error("Download error:", error);
        Alert.alert("Erreur", "Impossible de générer le ticket.");
      }
    };

    const handleDoctorPress = () => {
      if (onDoctorPress) {
        onDoctorPress();
      }
    };

    // ✅ Déterminer l'icône de paiement
    const paymentIcon: keyof typeof Ionicons.glyphMap =
      paymentMethod === "Espèces" ? "cash-outline" : "card-outline";

    return (
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={["60%", "95%"]}
        onClose={onClose}
        scrollable
        containerStyle={styles.sheet}
      >
        {/* ── Titre ── */}
        <Text style={styles.visitTitle}>{title}</Text>

        {/* ── Docteur & Statut ── */}
        <View style={styles.doctorStatusCard}>
          <TouchableOpacity
            style={styles.doctorRow}
            onPress={handleDoctorPress}
            activeOpacity={0.75}
          >
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={colors.white}
                />
              </View>
            )}
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctorName}</Text>
              <Text style={styles.specialty}>{specialty}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.inkMuted || colors.inkLight}
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
              <Text style={styles.totalValue}>{fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Motif ── */}
        <SectionTitle>Motif</SectionTitle>
        <Text style={styles.bodyText}>{reason}</Text>

        {/* ── Date & Heure ── */}
        <SectionTitle>Date & Heure</SectionTitle>
        <InfoRow icon="calendar-outline">
          <Text style={styles.bodyText}>{dateString}</Text>
        </InfoRow>

        {/* ── Lieux ── */}
        <SectionTitle>Lieux</SectionTitle>
        <InfoRow icon="location-outline">
          <Text style={styles.bodyText}>
            <Text style={styles.boldInline}>{clinic}</Text>
            {address ? ` ${address}` : ""}
          </Text>
        </InfoRow>

        {/* ── Image de la clinique ── */}
        {clinicImageSource && (
          <Image
            source={clinicImageSource}
            style={styles.clinicImage}
            resizeMode="cover"
          />
        )}

        {/* ── Carte ── */}
        <GrayButton
          label="Montrer sur la Carte"
          icon="map-outline"
          onPress={handleShowOnMap}
          style={styles.mapBtn}
        />

        {/* ── Méthodes de paiements ── */}
        <SectionTitle>Méthodes de paiements</SectionTitle>
        <PaymentRow icon={paymentIcon} label={paymentMethod} />

        {/* ── Facture ── */}
        <SectionTitle>Facture</SectionTitle>

        {invoiceLines.length > 0 ? (
          <>
            {invoiceLines.map((line, index) => (
              <View key={index} style={styles.invoiceLine}>
                <Text style={styles.invoiceLabel}>{line.label}</Text>
                <Text
                  style={[
                    styles.invoiceAmount,
                    line.isDiscount && styles.invoiceAmountDiscount,
                  ]}
                >
                  {line.isDiscount
                    ? `-${formatPrice(line.amount)} ${currencySymbol}`
                    : fmt(line.amount)}
                </Text>
              </View>
            ))}

            <View style={styles.totalLine}>
              <Text style={styles.totalLineLabel}>Total</Text>
              <Text style={styles.totalLineAmount}>{fmt(total)}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.bodyText}>Aucune facture disponible</Text>
        )}

        {/* ── Actions ── */}
        <View style={styles.actionsRow}>
          {actionVariant === "reschedule" ? (
            <>
              <PrimaryButton
                label="Réprogrammer"
                variant="solid"
                size="md"
                fullWidth={statusCfg.label === "Annulé"}
                onPress={handleReschedule}
                style={styles.rescheduleButton}
              />
              {statusCfg.label !== "Annulé" && (
                <GrayButton
                  label="Annuler"
                  onPress={handleCancel}
                  style={styles.cancelButton}
                />
              )}
            </>
          ) : (
            <PrimaryButton
              label="Réserver à nouveau"
              variant="solid"
              fullWidth
              size="md"
              onPress={handleBookAgain}
              style={styles.bookAgainButton}
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
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
    color: colors.inkMuted || colors.inkLight,
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
    color: colors.inkMuted || colors.inkLight,
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
    gap: 8,
  },
  rescheduleButton: {
    flex: 1.5,
  },
  cancelButton: {
    flex: 1,
  },
  bookAgainButton: {
    flex: 1,
  },
  downloadBtn: {
    width: 50,
    height: 50,
    borderRadius: 999,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
