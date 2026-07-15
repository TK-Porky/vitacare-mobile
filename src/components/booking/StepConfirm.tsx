import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";

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
    <Image
      source={require("@assets/images/icons/MomoIcon.png")}
      style={styles.logoImage}
      resizeMode="contain"
    />
  </View>
);

const OrangeIcon = () => (
  <View style={styles.logoBox}>
    <Image
      source={require("@assets/images/icons/OMIcon.png")}
      style={styles.logoImage}
      resizeMode="contain"
    />
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
  const { t } = useTranslation();
  const consultationFee = provider.priceXCFA;
  const total = consultationFee; // Pas de calcul complexe ici, le paiement se fera plus tard

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Page title ──────────────────────────────────────────────────── */}
      <Text style={styles.pageTitle}>{t('booking.confirm')}</Text>

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
              <Text style={styles.detailsTitle}>{t('appointments.detail')}</Text>
              <Text style={styles.dateTimeText}>
                {booking.date
                  ? formatDateTime(booking.date, booking.time)
                  : t('appointments.date')}
              </Text>
            </View>

            <View style={styles.detailsRight}>
              <TouchableOpacity
                style={styles.changerBtn}
                onPress={onChangeDate}
                activeOpacity={0.75}
              >
                <Text style={styles.changerBtnText}>{t('common.edit')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Divider />

          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>{t('appointments.reason')}</Text>
            <Text style={styles.detailValue}>
              {booking.reason || t('appointments.reason')}
            </Text>
          </View>

          <Divider />

          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>{t('booking.payment')}</Text>
            <Text style={styles.detailValue}>
              {formatPrice(consultationFee)}
            </Text>
          </View>

          <Divider />

          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>{t('appointments.clinic')}</Text>
            <Text style={[styles.detailValue]} numberOfLines={1}>
              {provider.location}
            </Text>
          </View>

          <Divider />

          <View style={styles.detailCol}>
            <Text style={styles.cancelTitle}>{t('appointments.cancel')}</Text>
            <Text style={styles.cancelBody}>
              {t('appointments.cancel')}
              <Text
                style={styles.cancelLink}
                onPress={() =>
                  Alert.alert(
                    t('common.info'),
                    t('errors.generic'),
                  )
                }
              >
                {t('common.info')}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* ── Paiement ────────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>{t('booking.payment')}</Text>
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
          title={t('booking.payNow')}
          subtitle={t('booking.payNow')}
        />
        <OptionCard
          selected={booking.paymentMethod === "later"}
          onPress={() => onChange({ paymentMethod: "later" })}
          iconSlot={
            <View style={styles.logoBox}>
              <Ionicons name="person-outline" size={20} color={colors.ink} />
            </View>
          }
          title={t('booking.payLater')}
          subtitle={t('booking.payLater')}
        />
      </View>

      {/* ── Choix du fournisseur (si paiement en ligne) ────────────────── */}
      {booking.paymentMethod === "now" && (
        <>
          <Text style={styles.sectionTitle}>{t('booking.payment')}</Text>
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
            <OptionCard
              selected={booking.paymentProvider === "card"}
              onPress={() => onChange({ paymentProvider: "card" })}
              iconSlot={
                <CardIcon active={booking.paymentProvider === "card"} />
              }
              title="Carte bancaire"
            />
          </View>
        </>
      )}

      {/* ── Note explicative ────────────────────────────────────────────── */}
      <View style={styles.noteBox}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={colors.primary}
        />
        <Text style={styles.noteText}>
          {booking.paymentMethod === "now"
            ? t('booking.payNow')
            : t('booking.payLater')}
        </Text>
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
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
    width: "100%",
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  providerSpecialty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },

  // ── Appointment details ──
  detailsSection: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 28,
    width: "100%",
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  detailsLeft: {
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },
  detailsRight: {
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
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
    width: "100%",
  },
  detailLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  detailValue: {
    fontFamily: fontFamily.semiBold,
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
    fontSize: fontSize.sm,
    color: colors.inkLight,
    lineHeight: 18,
  },
  cancelLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
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
    marginBottom: 20,
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
    // icon slot
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
    color: colors.inkLight,
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

  // ── Note ──
  noteBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary + "08",
    borderWidth: 1,
    borderColor: colors.primary + "30",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  noteText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    lineHeight: 18,
  },
});
