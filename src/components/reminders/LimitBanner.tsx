import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Info } from "lucide-react-native";
import { colors, fontFamily, fontSize } from "@/themes";

type LimitBannerProps = { onUpgrade?: () => void };

export const LimitBanner = ({ onUpgrade }: LimitBannerProps) => (
  <TouchableOpacity
    style={styles.banner}
    activeOpacity={0.85}
    onPress={onUpgrade}
    accessibilityLabel="Voir les offres premium"
    accessibilityRole="button"
  >
    <View style={styles.bannerIcon}>
      <Info size={18} color={colors.primary} />
    </View>
    <View style={styles.bannerText}>
      <Text style={styles.bannerTitle}>Limite de rappels gratuits</Text>
      <Text style={styles.bannerSubtitle}>
        Passez à VitaCare Premium pour ajouter un nombre illimité de
        médicaments.
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: { flex: 1 },
  bannerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
    lineHeight: 16,
  },
});
