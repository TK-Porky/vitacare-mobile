import { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MoreHorizontal } from "lucide-react-native";
import { colors, fontFamily, fontSize } from "../../themes";
import { PrimaryButton } from "../buttons";
import { ClinicProvider } from "../../types";
import { Skeleton } from "../generics";

function DoctorRow({
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
}) {
  return (
    <View style={styles.doctorRow}>
      <TouchableOpacity style={styles.avatar} onPress={onProfile}>
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.avatarInitial}>{name[0]}</Text>
        )}
      </TouchableOpacity>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{name}</Text>
        <View style={styles.doctorMeta}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{specialty}</Text>
          </View>
          <Text style={styles.price}> • {price}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onMore}
        activeOpacity={0.7}
        style={styles.moreBtn}
      >
        <MoreHorizontal size={18} color={colors.inkLight} />
      </TouchableOpacity>
    </View>
  );
}

function ClinicImage({
  uri,
  fallbackColor = "#C8B8A2",
}: {
  uri?: string;
  fallbackColor?: string;
}) {
  if (uri) {
    return <Image source={{ uri }} style={styles.image} resizeMode="cover" />;
  }
  return <View style={[styles.image, { backgroundColor: fallbackColor }]} />;
}

function ClinicInfo({
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
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.infoContainer}>
      <View style={styles.titleRow}>
        <Text style={styles.clinicName}>{clinicName}</Text>
        <PrimaryButton label="Réserver" size="sm" onPress={onReserve} />
      </View>

      <Text style={styles.description}>
        {description}
        {!expanded && (
          <Text style={styles.moreLink} onPress={() => setExpanded(true)}>
            {" ...plus"}
          </Text>
        )}
      </Text>

      <View style={styles.hoursRow}>
        <Text style={styles.infoText}>
          <Text style={styles.infoBold}>{hours}</Text>
        </Text>
        <Text style={styles.dot}> • </Text>
        <Text style={styles.infoText}>
          Ouvert de <Text style={styles.infoBold}>{days}</Text>
        </Text>
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={colors.inkLight} />
        <Text style={styles.location}>{location}</Text>
      </View>
    </View>
  );
}

interface ClinicCardProps {
  data: ClinicProvider;
  onReserve?: () => void;
  onMore?: () => void;
  onProfile?: () => void;
}

export function ClinicCard({ data, onReserve, onMore, onProfile }: ClinicCardProps) {
  return (
    <View style={styles.card}>
      <DoctorRow
        avatar={data.avatarUri}
        name={data.doctorName}
        specialty={data.specialty}
        price={data.price || `${data.priceXCFA || 0} FCFA`}
        onMore={onMore}
        onProfile={onProfile}
      />
      <ClinicImage
        uri={data.imageUri}
        fallbackColor={data.imageFallbackColor}
      />
      <ClinicInfo
        clinicName={data.clinicName}
        description={data.description}
        hours={data.hours}
        days={data.days}
        location={data.location}
        onReserve={onReserve}
      />
    </View>
  );
}

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
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginTop: 4 }}>
          <Skeleton width={120} height={12} />
          <Skeleton width={100} height={12} />
        </View>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginTop: 2 }}>
          <Skeleton width="40%" height={12} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D0C4B8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
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
  image: {
    width: "100%",
    height: 200,
  },
  infoContainer: {
    paddingVertical: 14,
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
  },
  location: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },
});
