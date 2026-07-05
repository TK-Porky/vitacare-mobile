import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, fontFamily, fontSize } from "@/themes";

type InlineDropdownProps = {
  label?: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  style?: object;
  accessibilityLabel?: string;
};

export const InlineDropdown = ({
  label,
  value,
  options,
  onSelect,
  style,
  accessibilityLabel,
}: InlineDropdownProps) => {
  const [open, setOpen] = useState(false);

  const handlePress = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setOpen((o) => !o);
  };

  const handleSelect = (opt: string) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(opt);
    setOpen(false);
  };

  return (
    <View style={[{ position: "relative" }, style]}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TouchableOpacity
        style={styles.trigger}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={
          accessibilityLabel || `Sélectionner ${label || "une option"}`
        }
        accessibilityRole="combobox"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.triggerText}>{value}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.inkMuted}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menu}>
              <FlatList
                data={options}
                keyExtractor={(item) => item}
                renderItem={({ item: opt }) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.menuItem,
                      opt === value && styles.menuItemSelected,
                    ]}
                    onPress={() => handleSelect(opt)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Sélectionner ${opt}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        opt === value && styles.menuItemTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    {opt === value && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                style={styles.menuList}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  triggerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: "80%",
    maxHeight: 300,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  menu: {
    borderRadius: 12,
    overflow: "hidden",
  },
  menuList: {
    maxHeight: 280,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemSelected: {
    backgroundColor: colors.primary + "15",
  },
  menuItemText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
    flex: 1,
  },
  menuItemTextSelected: {
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
});
