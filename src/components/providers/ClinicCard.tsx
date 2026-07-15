// components/ClinicCard.tsx
import React, { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MoreHorizontal } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { colors, fontFamily, fontSize } from "@/themes";
import { PrimaryButton } from "@/components/buttons";
import { ClinicProvider } from "@/types";
import { Skeleton } from "@/components/generics";

// ================================================================================== //
// Helpers
// ================================================================================== //

/**
 * Format price for display
 */
const formatPrice = (price?: string, priceXCFA?: number): string => {
  if (price) return price;
  if (priceXCFA) return `${priceXCFA} FCFA`;
  return "0 FCFA";
};

/**
 * Truncate description with ellipsis
 */
const MAX_DESCRIPTION_LENGTH = 150;
const truncateDescription = (
  text: string,
  expanded: boolean,
): { display: string; showMore: boolean } => {
  if (expanded || text.length <= MAX_DESCRIPTION_LENGTH) {
    return { display: text, showMore: false };
  }
  return {
    display: text.substring(0, MAX_DESCRIPTION_LENGTH),
    showMore: true,
  };
};

// ================================================================================== //
// Sub-components
// ================================================================================== //

/**
 * Doctor row component - displays doctor avatar, name, specialty, and price
 */
const DoctorRow = memo(
  ({
    avatar,
    name,
    specialty,
    price,
    onMore,
    onProfile,
  }: {
    avatar?: string;
    name: string;
    specialty: string;
    price: string;
    onMore?: () => void;
    onProfile?: () => void;
  }) => {
    const { t } = useTranslation();
    const resolvedName = name || t('provider.doctorNameDefault');
    const resolvedSpecialty = specialty || t('provider.specialtyDefault');
    const initial = resolvedName?.[0] || "?";

    return (
      <View style={styles.doctorRow}>
        <TouchableOpacity
          style={styles.avatar}
          onPress={onProfile}
          accessibilityLabel={t('provider.profileOf', { name: resolvedName })}
          accessibilityRole="button"
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName} onPress={onProfile} numberOfLines={1}>
            {resolvedName}
          </Text>
          <View style={styles.doctorMeta}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{resolvedSpecialty}</Text>
            </View>
            <Text style={styles.price}> • {price}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onMore}
          activeOpacity={0.7}
          style={styles.moreBtn}
          accessibilityLabel={t('provider.moreOptionsFor', { name: resolvedName })}
          accessibilityRole="button"
        >
          <MoreHorizontal size={18} color={colors.inkLight} />
        </TouchableOpacity>
      </View>
    );
  },
);

DoctorRow.displayName = "DoctorRow";

// ──────────────────────────────────────────────────────────────────────────────

/**
 * Clinic image component with loading state
 */
const ClinicImage = memo(
  ({
    uri,
    fallbackColor = "#C8B8A2",
  }: {
    uri?: string;
    fallbackColor?: string;
  }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoadStart = useCallback(() => {
      setIsLoading(true);
      setHasError(false);
    }, []);

    const handleLoadEnd = useCallback(() => {
      setIsLoading(false);
    }, []);

    const handleError = useCallback(() => {
      setIsLoading(false);
      setHasError(true);
    }, []);

    if (!uri || hasError) {
      return (
        <View style={[styles.image, { backgroundColor: fallbackColor }]} />
      );
    }

    return (
      <View style={styles.imageContainer}>
        {isLoading && (
          <View
            style={[
              styles.image,
              styles.imageLoading,
              { backgroundColor: fallbackColor },
            ]}
          >
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
        <Image
          source={{ uri }}
          style={[styles.image, isLoading && styles.imageHidden]}
          resizeMode="cover"
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      </View>
    );
  },
);

ClinicImage.displayName = "ClinicImage";

// ──────────────────────────────────────────────────────────────────────────────

/**
 * Clinic information component
 */
const ClinicInfo = memo(
  ({
    clinicName,
    description,
    hours,
    days,
    location,
    onReserve,
  }: {
    clinicName: string;
    description: string;
    hours: string;
    days: string;
    location: string;
    onReserve?: () => void;
  }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    const handleToggleExpand = useCallback(() => {
      setExpanded((prev) => !prev);
    }, []);

    const resolvedName = clinicName || t('provider.clinicNameDefault');
    const resolvedDesc = description || t('provider.descriptionDefault');
    const resolvedHours = hours || t('provider.hoursDefault');
    const resolvedDays = days || t('provider.daysDefault');
    const resolvedLocation = location || t('provider.locationDefault');
    const { display, showMore } = truncateDescription(resolvedDesc, expanded);

    return (
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.clinicName} numberOfLines={1}>
            {resolvedName}
          </Text>
          <PrimaryButton label={t('appointments.book')} size="sm" onPress={onReserve} />
        </View>

        <Text style={styles.description}>
          {display}
          {showMore && (
            <Text style={styles.moreLink} onPress={handleToggleExpand}>
              {t('common.plus')}
            </Text>
          )}
          {expanded && resolvedDesc.length > MAX_DESCRIPTION_LENGTH && (
            <Text style={styles.moreLink} onPress={handleToggleExpand}>
              {t('common.less')}
            </Text>
          )}
        </Text>

        <View style={styles.hoursRow}>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>{resolvedHours}</Text>
          </Text>
          <Text style={styles.dot}> • </Text>
          <Text style={styles.infoText}>
            {t('common.openFrom')} <Text style={styles.infoBold}>{resolvedDays}</Text>
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.inkLight} />
          <Text style={styles.location} numberOfLines={1}>
            {resolvedLocation}
          </Text>
        </View>
      </View>
    );
  },
);

ClinicInfo.displayName = "ClinicInfo";

// ================================================================================== //
// Main Component
// ================================================================================== //

interface ClinicCardProps {
  data: ClinicProvider;
  onReserve?: () => void;
  onMore?: () => void;
  onProfile?: () => void;
  isLoading?: boolean;
}

/**
 * Clinic card component - displays clinic information in a card format
 */
export function ClinicCard({
  data,
  onReserve,
  onMore,
  onProfile,
  isLoading = false,
}: ClinicCardProps) {
  const price = formatPrice(data.price, data.priceXCFA);

  if (isLoading) {
    return <ClinicCardSkeleton />;
  }

  return (
    <View style={styles.card}>
      <DoctorRow
        avatar={data.avatarUri}
        name={data.doctorName}
        specialty={data.specialty}
        price={price}
        onMore={onMore}
        onProfile={onProfile || onMore}
      />
      <ClinicImage
        uri={data.imageUri}
        fallbackColor={data.imageFallbackColor}
      />
      <ClinicInfo
        clinicName={data.clinicName}
        description={data.description}
        hours={data.hours!}
        days={data.days!}
        location={data.location}
        onReserve={onReserve}
      />
    </View>
  );
}

// ================================================================================== //
// Skeleton
// ================================================================================== //

/**
 * Skeleton loading state for clinic card
 */
export function ClinicCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.doctorRow}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={[styles.doctorInfo, { gap: 6, marginLeft: 10 }]}>
          <Skeleton width="60%" height={16} />
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Skeleton width={80} height={12} borderRadius={10} />
            <Skeleton width={40} height={12} />
          </View>
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>

      <Skeleton width="100%" height={200} borderRadius={0} />

      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Skeleton width="50%" height={20} />
          <Skeleton width={80} height={32} borderRadius={20} />
        </View>
        <View style={{ gap: 6, marginTop: 4 }}>
          <Skeleton width="100%" height={14} />
          <Skeleton width="85%" height={14} />
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <Skeleton width={120} height={12} />
          <Skeleton width={100} height={12} />
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
            marginTop: 2,
          }}
        >
          <Skeleton width="40%" height={12} />
        </View>
      </View>
    </View>
  );
}

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    backgroundColor: colors.white,
    elevation: 0,
  },

  // Doctor Row
  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inkLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },
  doctorInfo: {
    flex: 1,
    gap: 3,
  },
  doctorName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  doctorMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "#F3E5F5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
    color: "#9C27B0",
  },
  price: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },
  moreBtn: {
    padding: 4,
  },

  // Clinic Image
  imageContainer: {
    position: "relative",
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    height: 400,
  },
  imageLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  imageHidden: {
    opacity: 0,
  },

  // Clinic Info
  infoContainer: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clinicName: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.ink,
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.inkMuted,
    lineHeight: 20,
  },
  moreLink: {
    color: colors.primary,
    fontFamily: fontFamily.medium,
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkMuted,
  },
  infoBold: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  dot: {
    color: colors.inkLight,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  location: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    flexShrink: 1,
  },
});
