import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fontFamily, fontSize } from "@/themes";
import { Drug } from "@/types";

type SearchDrugCardProps = {
  item: Drug;
  onPress?: (item: Drug) => void;
};

export const SearchDrugCard = React.memo(({ item, onPress }: SearchDrugCardProps) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.drugCard}
      activeOpacity={0.8}
      onPress={() => onPress?.(item)}
    >
      <View style={styles.drugImageWrap}>
        <Image
          source={{ uri: item.imageUrl || "https://via.placeholder.com/150" }}
          style={styles.drugImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.drugBody}>
        <Text style={styles.drugCategory} numberOfLines={1}>
          {item.dosageForm || t("medications.available")}
        </Text>
        <Text style={styles.drugName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.referencePrice != null && (
          <Text style={styles.drugPrice}>{item.referencePrice} FCFA</Text>
        )}
      </View>
      <TouchableOpacity style={styles.voirBtn} activeOpacity={0.85}>
        <LinearGradient
          colors={[
            colors.gradientStart,
            colors.gradientMid1,
            colors.gradientStart,
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.voirGradient}
        >
          <Text style={styles.voirLabel}>{t("common.seeAll")}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  drugCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  drugImageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  drugImage: { width: "100%", height: "100%" },
  drugBody: { padding: 10, gap: 3 },
  drugCategory: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  drugName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.ink,
    lineHeight: 17,
  },
  drugPrice: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primaryDark,
  },
  voirBtn: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  voirGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 999,
  },
  voirLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
});
