import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fontFamily, fontSize } from "@/themes";

type ChipOption = {
  label: string;
  value: string;
};

type ChipSelectorProps = {
  options: ChipOption[];
  value?: string;
  onChange: (value: string) => void;
};

export const ChipSelector = ({ options, value, onChange }: ChipSelectorProps) => (
  <View style={styles.container}>
    {options.map((opt) => {
      const selected = value === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[styles.chip, selected && styles.chipSelected]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  chipTextSelected: {
    color: colors.white,
  },
});
