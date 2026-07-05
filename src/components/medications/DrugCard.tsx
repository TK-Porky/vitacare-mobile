import { TouchableOpacity, Image, Text, View, StyleSheet } from "react-native";
import { colors, fontFamily, fontSize } from "@/themes";
import { StoreMedicationResponse } from "@/types/api-responses";

type DrugCardProps = {
  item: StoreMedicationResponse;
  onPress?: (drug: StoreMedicationResponse) => void;
  hasReminder?: boolean;
};

export const DrugCard = ({ item, onPress, hasReminder }: DrugCardProps) => {
  return (
    <TouchableOpacity
      style={styles.drugCard}
      activeOpacity={0.85}
      onPress={() => onPress?.(item)}
    >
      <View style={styles.drugImageContainer}>
        <Image
          source={{ uri: item.imageUrl || "https://via.placeholder.com/150" }}
          style={styles.drugImage}
          resizeMode="cover"
        />
        {hasReminder && (
          <View style={styles.reminderBadge}>
            <Text style={styles.reminderBadgeText}>🔔</Text>
          </View>
        )}
      </View>
      <View style={styles.drugInfo}>
        <Text style={styles.drugCategory}>
          {item.dosageForm || "Médicament"}
        </Text>
        <Text style={styles.drugName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.referencePrice != null && (
          <Text style={styles.drugPrice}>{item.referencePrice} FCFA</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  drugCard: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },
  drugImageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: colors.surface,
    position: "relative",
  },
  drugImage: {
    width: "100%",
    height: "100%",
  },
  reminderBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(46, 204, 113, 0.9)",
    borderRadius: 12,
    padding: 4,
    paddingHorizontal: 8,
  },
  reminderBadgeText: {
    fontSize: 12,
  },
  drugInfo: {
    padding: 12,
  },
  drugCategory: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    marginBottom: 4,
  },
  drugName: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
    marginBottom: 6,
    lineHeight: 18,
  },
  drugPrice: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
});
