import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "../../themes";

// ─── Types ────────────────────────────────────────────────────────────────────

type Provider = {
  name: string;
  specialty: string;
  avatarUri: string;
  priceXCFA: number;
  location: string;
};

type BookingData = {
  date: Date | null;
  time: string | null;
  reason: string;
  paymentMethod: "now" | "later";
  paymentProvider: "mobile_money" | "orange_money" | "card";
};

type Props = {
  provider: Provider;
  booking: BookingData;
  onChangeDate: () => void;
  onChange: (patch: Partial<BookingData>) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDateTime = (date: Date, time: string | null): string => {
  const day = DAYS[date.getDay()];
  const d = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const t = time ? time.replace(":", "h") : "";
  return t
    ? `${day}, ${d} ${month} ${year} • ${t}`
    : `${day}, ${d} ${month} ${year}`;
};

const formatPrice = (n: number): string => {
  const s = Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${s} XCFA`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Divider = () => <View style={styles.divider} />;

type OptionCardProps = {
  selected: boolean;
  onPress: () => void;
  iconSlot: React.ReactNode;
  title: string;
  subtitle?: string;
};

const OptionCard = ({
  selected,
  onPress,
  iconSlot,
  title,
  subtitle,
}: OptionCardProps) => (
  <TouchableOpacity
    style={[styles.optionCard, selected && styles.optionCardSelected]}
    onPress={onPress}
    activeOpacity={1}
  >
    <View style={styles.optionIconBox}>{iconSlot}</View>
    <View style={styles.optionBody}>
      <Text
        style={[styles.optionTitle, selected && styles.optionTitleSelected]}
      >
        {title}
      </Text>
      {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
    </View>
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);

// ─── Payment provider icon boxes ──────────────────────────────────────────────

const MtnIcon = () => (
  <View style={styles.logoBox}>
    <Image source={require("../../../assets/MomoIcon.png")} style={styles.logoImage} resizeMode="contain" />
  </View>
);

const OrangeIcon = () => (
  <View style={styles.logoBox}>
    <Image source={require("../../../assets/OMIcon.png")} style={styles.logoImage} resizeMode="contain" />
  </View>
);

const CardIcon = ({ active }: { active: boolean }) => (
  <View
    style={[
      styles.logoBox,
      { backgroundColor: active ? colors.primary + "18" : colors.surface },
    ]}
  >
    <Ionicons
      name="business-outline"
      size={20}
      color={active ? colors.primary : colors.inkMuted}
    />
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const StepConfirm = ({
  provider,
  booking,
  onChangeDate,
  onChange,
}: Props) => {
  const consultationFee = provider.priceXCFA;
  const inAppDiscount = Math.round(consultationFee * 0.03);
  const taxes = Math.round(consultationFee * 0.03);
  const total = consultationFee - inAppDiscount + taxes;

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Page title ──────────────────────────────────────────────────── */}
      <Text style={styles.pageTitle}>Confirmation de réservation</Text>

      {/* ── Provider card ───────────────────────────────────────────────── */}
      <View style={styles.providerCard}>
        
        <View style={styles.providerSection}>
          <Image source={{ uri: provider.avatarUri }} style={styles.avatar} />
          <View>
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.providerSpecialty}>{provider.specialty}</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>

          <Divider />

          <View style={styles.details}>
            <View style={styles.detailsLeft}>
              <Text style={styles.detailsTitle}>Détails du Rendez-vous</Text>
              <Text style={styles.dateTimeText}>
                {booking.date
                  ? formatDateTime(booking.date, booking.time)
                  : "Date à sélectionner"}
              </Text>
            </View>
            
            <View style={styles.detailsRight}>
              <TouchableOpacity
                style={styles.changerBtn}
                onPress={onChangeDate}
                activeOpacity={0.75}
              >
                <Text style={styles.changerBtnText}>Changer</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Divider />

          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Prix</Text>
            <Text style={styles.detailValue}>
              {formatPrice(consultationFee)}
            </Text>
          </View>

          <Divider />

          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text
              style={[styles.detailValue]}
              numberOfLines={1}
            >
              {provider.location}
            </Text>
          </View>

          <Divider />

          <View style={styles.detailCol}>
            <Text style={styles.cancelTitle}>Annulation Gratuite</Text>
            <Text style={styles.cancelBody}>
              Annuler avant le *** pour un remboursement totale.{" "}
              <Text
              style={styles.cancelLink}
              onPress={() =>
                Alert.alert(
                  "Politique d'utilisation",
                  "Les conditions d'annulation complètes s'appliquent selon les termes de réservation VitaCare.",
                )
              }
            >
              Politique d'utilisation
            </Text>
          </Text>
          </View>
        </View>
      </View>

      {/* ── Payment method ──────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Méthodes de paiements</Text>
      <View style={styles.cardGroup}>
        <OptionCard
          selected={booking.paymentMethod === "now"}
          onPress={() => onChange({ paymentMethod: "now" })}
          iconSlot={
            <View style={styles.logoBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.ink}
              />
            </View>
          }
          title={`Payer ${formatPrice(total)} dès maintenant`}
          subtitle="Améliore vos chances d'être prioritaire"
        />
        <OptionCard
          selected={booking.paymentMethod === "later"}
          onPress={() => onChange({ paymentMethod: "later" })}
          iconSlot={
            <View style={styles.logoBox}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.ink}
              />
            </View>
          }
          title="Payer à la consultation"
        />
      </View>

      {/* ── Payment provider ────────────────────────────────────────────── */}
      {booking.paymentMethod === "now" && (
      <>
        <Text style={styles.sectionTitle}>Moyens de paiements</Text>
        <View style={styles.cardGroup}>
          <OptionCard
            selected={booking.paymentProvider === "mobile_money"}
            onPress={() => onChange({ paymentProvider: "mobile_money" })}
            iconSlot={<MtnIcon />}
            title="Mobile Money"
          />
          <OptionCard
            selected={booking.paymentProvider === "orange_money"}
            onPress={() => onChange({ paymentProvider: "orange_money" })}
            iconSlot={<OrangeIcon />}
            title="Orange Money"
          />
          {/*
          <OptionCard
            selected={booking.paymentProvider === "card"}
            onPress={() => onChange({ paymentProvider: "card" })}
            iconSlot={<CardIcon active={booking.paymentProvider === "card"} />}
            title="Carte bancaire"
            subtitle="Numéro de compte *2456"
            />
          */}
        </View>
      </>)}

      {/* ── Invoice ─────────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Facture</Text>
      <View style={styles.invoiceSection}>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Consultation</Text>
          <Text style={styles.invoiceValue}>
            {formatPrice(consultationFee)}
          </Text>
        </View>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Code de réduction</Text>
          <Text style={styles.invoiceDiscount}>
            -{formatPrice(inAppDiscount)}
          </Text>
        </View>

        <Divider />

        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceSubLabel}>Prix Estimé</Text>
          <Text style={styles.invoiceSubValue}>
            {formatPrice(consultationFee)}
          </Text>
        </View>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceSubLabel}>Taxes</Text>
          <Text style={styles.invoiceSubValue}>{formatPrice(taxes)}</Text>
        </View>

        <View style={styles.invoiceTotalRow}>
          <Text style={styles.invoiceTotalLabel}>Total</Text>
          <Text style={styles.invoiceTotalValue}>{formatPrice(total)}</Text>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },

  // ── Page title ──
  pageTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
    marginBottom: 20,
    lineHeight: 32,
  },

  // ── Provider card ──
  providerCard: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.ltsurface,
    borderRadius: 16,
    marginBottom: 24,
  },
  providerSection: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.border,
  },
  providerName: {
    width: '100%',
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  providerSpecialty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },

  // ── Appointment details ──
  detailsSection: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 28,
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  detailsLeft: {
    flexDirection: "column",
    gap: 12,
  },
  detailsRight: {
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  changerBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  changerBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  dateTimeText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  detailCol: {
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-start",
  },
  detailLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  detailValue: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  cancelTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.ink,
    marginBottom: 4,
  },
  cancelBody: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    lineHeight: 16,
  },
  cancelLink: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.ink,
    textDecorationLine: "underline",
  },

  // ── Section title ──
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    marginBottom: 14,
    marginTop: 8,
  },

  // ── Option cards ──
  cardGroup: {
    gap: 12,
    marginBottom: 28,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionCardSelected: {
    borderColor: colors.ink,
  },
  optionIconBox: {
    // icon slot renders its own box
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  logoText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
  },
  optionBody: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  optionTitleSelected: {
    color: colors.ink,
  },
  optionSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderWidth: 6,
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // ── Invoice ──
  invoiceSection: {
    flexDirection: "column",
    gap: 8,
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  invoiceLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  invoiceValue: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  invoiceDiscount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  invoiceSubLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  invoiceSubValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  invoiceTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceTotalLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  invoiceTotalValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primary,
  },
});
