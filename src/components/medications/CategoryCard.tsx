import { View } from "react-native";
import { TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import { colors, fontFamily, fontSize } from "@/themes";
import { MedicationCategory } from "@/types/medications";

type CategoryCardProps = {
  item: MedicationCategory;
  onPress?: () => void;
};

export const CategoryCard = ({ item, onPress }: CategoryCardProps) => {
  return (
    <TouchableOpacity
      style={styles.categoryCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Image
        source={{ uri: item.imageUri }}
        style={styles.categoryImage}
        resizeMode="cover"
      />
      <View style={styles.categoryLabelRow}>
        <Text style={styles.categoryLabel}>{item.label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    width: 120,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryImage: {
    width: "100%",
    height: 80,
    backgroundColor: colors.surface,
  },
  categoryLabelRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.ink,
  },
});
