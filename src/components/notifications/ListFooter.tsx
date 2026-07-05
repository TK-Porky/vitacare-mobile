import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, fontFamily, fontSize } from "@/themes";

interface ListFooterProps {
  isLoadingMore: boolean;
  hasMore: boolean;
  inboxLength: number;
}

export const ListFooter = ({
  isLoadingMore,
  hasMore,
  inboxLength,
}: ListFooterProps) => {
  if (isLoadingMore) {
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Chargement...</Text>
      </View>
    );
  }

  if (inboxLength > 0 && !hasMore) {
    return (
      <View style={styles.endOfList}>
        <Text style={styles.endOfListText}>
          Toutes les notifications sont chargées
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 12,
  },
  footerText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },
  endOfList: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endOfListText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },
});
