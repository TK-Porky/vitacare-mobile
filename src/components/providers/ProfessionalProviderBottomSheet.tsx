// components/providers/ProfessionalProviderBottomSheet.tsx
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  memo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18next from "@/i18n";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/generics";
import { PrimaryButton } from "@/components/buttons";
import { colors, fontFamily, fontSize } from "@/themes";
import {
  ShareContactBottomSheet,
  ShareContactBottomSheetRef,
} from "@/components/providers/ShareContactBottomSheet";

// ================================================================================== //
// Types
// ================================================================================== //

export type ReservationStatus = "none" | "confirmed" | "pending";

export type Provider = {
  clinicName: string;
  avatarUri: string;
  specialty: string;
  experience: string;
  language: string;
  doctorName: string;
  description: string;
  hoursRange?: string;
  hoursdays?: string;
  location: string;
  coverUri?: string;
  phone?: string;
  email?: string;
  website?: string;
};

export type ProfessionalProviderBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  provider?: Provider;
  reservationStatus?: ReservationStatus;
  onShare?: () => void;
  onReservation?: () => void;
  onCancelReservation?: () => void;
  onShowOnMap?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
};

// ================================================================================== //
// Constants
// ================================================================================== //

const DEFAULT_PROVIDER: Provider = {
  clinicName: i18next.t('provider.clinicNameDefault'),
  avatarUri: "",
  specialty: i18next.t('provider.specialtyDefault'),
  experience: i18next.t('provider.experienceDefault', { years: 0 }),
  language: i18next.t('provider.languageDefault'),
  doctorName: i18next.t('provider.doctorNameDefault'),
  description: i18next.t('provider.descriptionDefault'),
  hoursRange: i18next.t('provider.hoursDefault'),
  hoursdays: i18next.t('provider.daysDefault'),
  location: i18next.t('provider.locationDefault'),
  coverUri: undefined,
  phone: "+237 6XX XX XX XX",
  email: "contact@clinique.com",
  website: "www.clinique.com",
};

// ================================================================================== //
// Sub-components
// ================================================================================== //

/**
 * Status badge component
 */
const StatusBadge = memo(({ status }: { status: ReservationStatus }) => {
  const { t } = useTranslation();
  if (status === "none") return null;

  const isConfirmed = status === "confirmed";
  return (
    <View
      style={[
        styles.badge,
        isConfirmed ? styles.badgeConfirmed : styles.badgePending,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          isConfirmed ? styles.badgeTextConfirmed : styles.badgeTextPending,
        ]}
      >
        {isConfirmed ? t('provider.confirmed') : t('provider.pendingValidation')}
      </Text>
    </View>
  );
});

StatusBadge.displayName = "StatusBadge";

/**
 * Stat column component
 */
const StatColumn = memo(
  ({ value, label }: { value: string; label: string }) => (
    <View style={styles.statColumn}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  ),
);

StatColumn.displayName = "StatColumn";

/**
 * Info row component
 */
const InfoRow = memo(
  ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.inkMuted} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  ),
);

InfoRow.displayName = "InfoRow";

/**
 * Avatar component with fallback
 */
const Avatar = memo(({ uri, name }: { uri?: string; name?: string }) => {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (!uri || hasError) {
    const initial = name?.[0] || "?";
    return (
      <View style={[styles.avatar, styles.avatarFallback]}>
        <Text style={styles.avatarInitial}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.avatar}
      resizeMode="cover"
      onError={handleError}
    />
  );
});

Avatar.displayName = "Avatar";

// ================================================================================== //
// Main Component
// ================================================================================== //

export const ProfessionalProviderBottomSheet = forwardRef<
  ProfessionalProviderBottomSheetRef,
  Props
>(
  (
    {
      provider = DEFAULT_PROVIDER,
      reservationStatus = "none",
      onShare,
      onReservation,
      onCancelReservation,
      onShowOnMap,
      onClose,
      isLoading = false,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const shareSheetRef = useRef<ShareContactBottomSheetRef>(null);

    // ================================================================================== //
    // Handlers
    // ================================================================================== //

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    const handleShare = useCallback(() => {
      if (onShare) {
        onShare();
        return;
      }
      shareSheetRef.current?.open();
    }, [onShare]);

    const handleReservation = useCallback(() => {
      onReservation?.();
      sheetRef.current?.close();
    }, [onReservation]);

    const handleCancelReservation = useCallback(() => {
      if (reservationStatus === "none") {
        Alert.alert(t('common.info'), t('provider.noReservation'));
        return;
      }
      onCancelReservation?.();
      sheetRef.current?.close();
    }, [reservationStatus, onCancelReservation]);

    const handleShowOnMap = useCallback(() => {
      onShowOnMap?.();
      sheetRef.current?.close();
    }, [onShowOnMap]);

    // ================================================================================== //
    // Button state
    // ================================================================================== //

    const getButtonConfig = useCallback(() => {
      if (reservationStatus === "pending") {
        return {
          label: t('provider.pending'),
          variant: undefined,
          disabled: true,
        };
      }
      if (reservationStatus === "confirmed") {
        return {
          label: t('provider.cancelReservation'),
          variant: "outline" as const,
          disabled: false,
        };
      }
      return {
        label: t('provider.makeReservation'),
        variant: "solid" as const,
        disabled: false,
      };
    }, [reservationStatus, t]);

    // ================================================================================== //
    // Render
    // ================================================================================== //

    const buttonConfig = getButtonConfig();

    if (isLoading) {
      return (
        <AppBottomSheet
          ref={sheetRef}
          snapPoints={["55%", "92%"]}
          onClose={onClose}
          scrollable
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('provider.loading')}</Text>
          </View>
        </AppBottomSheet>
      );
    }

    return (
      <>
        <AppBottomSheet
          ref={sheetRef}
          snapPoints={["55%", "92%"]}
          onClose={onClose}
          scrollable
        >
          <View style={styles.content}>
            {/* ── Header ── */}
            <View style={styles.titleRow}>
              <Text style={styles.clinicName} numberOfLines={1}>
                {provider.clinicName}
              </Text>
              <StatusBadge status={reservationStatus} />
            </View>

            {/* ── Doctor Info ── */}
            <View style={styles.header}>
              <Avatar uri={provider.avatarUri} name={provider.doctorName} />
              <View style={styles.statsRow}>
                <StatColumn value={provider.specialty} label={t('provider.specialty')} />
                <View style={styles.statDivider} />
                <StatColumn value={provider.experience} label={t('provider.experience')} />
                <View style={styles.statDivider} />
                <StatColumn value={provider.language} label={t('provider.language')} />
              </View>
            </View>

            <Text style={styles.doctorName}>{provider.doctorName}</Text>
            <Text style={styles.description}>{provider.description}</Text>

            {/* ── Actions ── */}
            <View style={styles.ctaRow}>
              <PrimaryButton
                label={buttonConfig.label}
                variant={buttonConfig.variant}
                size="md"
                fullWidth={true}
                onPress={buttonConfig.disabled ? undefined : handleReservation}
                isDisabled={buttonConfig.disabled}
                style={styles.ctaBtn}
              />
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShare}
                activeOpacity={0.7}
                accessibilityLabel={t('provider.shareAccessibility')}
                accessibilityRole="button"
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={colors.ink}
                />
              </TouchableOpacity>
            </View>

            {/* ── Hours ── */}
            {(provider.hoursRange || provider.hoursdays) && (
              <>
                <Text style={styles.sectionTitle}>{t('provider.hoursTitle')}</Text>
                <InfoRow
                  icon="time-outline"
                  text={provider.hoursRange || t('provider.notSpecified')}
                />
                <InfoRow
                  icon="calendar-outline"
                  text={provider.hoursdays || t('provider.notSpecified')}
                />
              </>
            )}

            {/* ── Location ── */}
            <Text style={styles.sectionTitle}>{t('provider.locationTitle')}</Text>
            <InfoRow icon="location-outline" text={provider.location} />

            {/* ── Cover Image ── */}
            {provider.coverUri ? (
              <Image
                source={{ uri: provider.coverUri }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.coverImage, styles.coverPlaceholder]}>
                <Ionicons
                  name="image-outline"
                  size={40}
                  color={colors.inkLight}
                />
                <Text style={styles.coverPlaceholderText}>
                  {t('provider.noImage')}
                </Text>
              </View>
            )}

            {/* ── Map Button ── */}
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={handleShowOnMap}
              activeOpacity={0.7}
              accessibilityLabel={t('provider.showOnMapAccessibility')}
              accessibilityRole="button"
            >
              <Ionicons name="map-outline" size={18} color={colors.ink} />
              <Text style={styles.mapBtnText}>{t('provider.showOnMap')}</Text>
            </TouchableOpacity>
          </View>
        </AppBottomSheet>

        {/* ── Share Contact Bottom Sheet ── */}
        <ShareContactBottomSheet ref={shareSheetRef} provider={provider} />
      </>
    );
  },
);

ProfessionalProviderBottomSheet.displayName = "ProfessionalProviderBottomSheet";

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    marginTop: 12,
  },

  // Title Row
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  clinicName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    flexShrink: 1,
  },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeConfirmed: {
    backgroundColor: "#E6F9EE",
  },
  badgePending: {
    backgroundColor: "#FFF4E5",
  },
  badgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  badgeTextConfirmed: {
    color: "#1A7F3C",
  },
  badgeTextPending: {
    color: "#B45309",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.white,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statColumn: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },

  // Doctor
  doctorName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    marginBottom: 6,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    lineHeight: 20,
    marginBottom: 20,
  },

  // CTA
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  ctaBtn: {
    flex: 1,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // Sections
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
    marginBottom: 8,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
  },

  // Cover
  coverImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: colors.border,
  },
  coverPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  coverPlaceholderText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginTop: 8,
  },

  // Map
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: Platform.OS === "ios" ? 24 : 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  mapBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
});
