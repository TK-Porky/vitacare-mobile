import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/generics/Skeleton";
import { colors } from "@/themes";

export function DrugCardSkeleton() {
  return (
    <View style={styles.drugCard}>
      <Skeleton width="100%" height={120} borderRadius={0} />
      <View style={styles.drugInfo}>
        <Skeleton width="60%" height={12} borderRadius={6} style={styles.category} />
        <Skeleton width="90%" height={14} borderRadius={6} style={styles.name} />
        <Skeleton width="40%" height={14} borderRadius={6} style={styles.price} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drugCard: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  drugInfo: {
    padding: 12,
  },
  category: {
    marginBottom: 8,
  },
  name: {
    marginBottom: 10,
  },
  price: {
    marginBottom: 2,
  },
});
