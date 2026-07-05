import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors, fontFamily, fontSize } from "@/themes";
import { FilterStatus, STATUS_LABELS } from "@/constants/reminders";

type FilterTabsProps = {
  value: FilterStatus;
  onChange: (v: FilterStatus) => void;
};

export const FilterTabs = ({ value, onChange }: FilterTabsProps) => {
  const statuses: FilterStatus[] = [
    "ALL",
    "PENDING",
    "TAKEN",
    "MISSED",
    "SNOOZED",
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {statuses.map((status) => (
        <TouchableOpacity
          key={status}
          style={[styles.filterTab, value === status && styles.filterTabActive]}
          onPress={() => onChange(status)}
          accessibilityLabel={`Filtrer par ${STATUS_LABELS[status]}`}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.filterText,
              value === status && styles.filterTextActive,
            ]}
          >
            {STATUS_LABELS[status]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  filterContainer: { marginBottom: 16 },
  filterContent: { gap: 8, paddingVertical: 4 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  filterTextActive: {
    color: colors.white,
  },
});
