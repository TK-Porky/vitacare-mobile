import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";
import { MedicationCategory } from "@/types/medications";

type CategoryListItemProps = {
  item: MedicationCategory;
  count: number;
  onPress?: () => void;
};

export const CategoryListItem = ({
  item,
  count,
  onPress,
}: CategoryListItemProps) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: item.imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={styles.count}>
          {count} médicament{count !== 1 ? "s" : ""}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.inkLight}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  imageWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  count: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
});
