import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";

export type MenuItemProps = {
  icon: string;
  label: string;
  subText?: string;
  danger?: boolean;
  onPress?: () => void;
  showChevron?: boolean;
};

export function MenuItem({
  icon,
  label,
  subText,
  danger = false,
  onPress,
  showChevron = true,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityHint={subText}
    >
      <View style={[styles.menuIconWrapper]}>
        <Ionicons
          name={icon as any}
          size={18}
          color={danger ? colors.error : colors.primary}
        />
      </View>
      <View style={styles.menuLabelWrapper}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
          {label}
        </Text>
        {subText && <Text style={styles.menuSubText}>{subText}</Text>}
      </View>
      {!danger && showChevron && (
        <Feather name="chevron-right" size={16} color={colors.inkLight} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabelWrapper: {
    flex: 1,
  },
  menuSubText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    marginTop: 1,
  },
  menuLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  menuLabelDanger: {
    color: colors.error,
  },
});
