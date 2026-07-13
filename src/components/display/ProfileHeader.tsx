import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors, fontFamily, fontSize } from "@/themes";
import { PrimaryButton } from "../buttons";

type ProfileHeaderProps = {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  avatarUrl?: string;
  address?: string;
  onLocationPress?: () => void;
};

export function ProfileHeader({
  fullName,
  phoneNumber,
  email,
  avatarUrl,
  address,
  onLocationPress,
}: ProfileHeaderProps) {
  const { t } = useTranslation();

  const getInitialsAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    return `https://ui-avatars.com/api/?name=${initials}&background=0D9488&color=fff&size=128&bold=true`;
  };

  const avatarUri = avatarUrl || getInitialsAvatar(fullName || "U");
  const displayContact = phoneNumber || email || t("profile.userFallback");

  return (
    <View style={styles.profileCard}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      </View>
      <Text style={styles.userName}>{fullName || t("profile.userFallback")}</Text>
      <Text style={styles.userContact}>{displayContact}</Text>

      <PrimaryButton
        label={address ? address : t("profile.addAddress")}
        onPress={onLocationPress}
        variant={address ? "outline" : "solid"}
        size="sm"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 28,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginBottom: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    marginBottom: 4,
  },
  userContact: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginBottom: 16,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    width: "100%",
    justifyContent: "center",
  },
  locationBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
});
