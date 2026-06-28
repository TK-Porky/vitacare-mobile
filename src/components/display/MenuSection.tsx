// components/MenuSection.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MenuItem, MenuItemProps } from "./MenuItem";
import { colors, fontFamily, fontSize } from "@/themes";

export type MenuSectionItem = MenuItemProps & {
  id: string;
  route?: string;
};

export type MenuSectionProps = {
  title: string;
  items: MenuSectionItem[];
  onItemPress?: (item: MenuSectionItem) => void;
};

export function MenuSection({ title, items, onItemPress }: MenuSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, index) => (
          <View key={item.id}>
            <MenuItem
              icon={item.icon}
              label={item.label}
              subText={item.subText}
              danger={item.danger}
              showChevron={item.showChevron}
              onPress={() => onItemPress?.(item)}
            />
            {index < items.length - 1 && <View style={styles.itemDivider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.inkLight,
    letterSpacing: 0.3,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 16,
    backgroundColor: colors.white,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 66,
  },
});
