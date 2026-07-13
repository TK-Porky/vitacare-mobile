import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";

type EmptyStateProps = {
  isSearching: boolean;
  onClearSearch: () => void;
};

export const EmptyState = ({ isSearching, onClearSearch }: EmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="medkit-outline" size={48} color={colors.inkLight} />
      <Text style={styles.emptyText}>
        {isSearching
          ? t("medications.searchNoResults")
          : t("medications.empty")}
      </Text>
      {isSearching && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={onClearSearch}
        >
          <Text style={styles.clearSearchButtonText}>{t("common.search")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    marginTop: 12,
    textAlign: "center",
  },
  clearSearchButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearSearchButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
});
