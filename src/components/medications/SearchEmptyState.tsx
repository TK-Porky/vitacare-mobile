import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";

type SearchEmptyStateProps = {
  query: string;
};

export const SearchEmptyState = ({ query }: SearchEmptyStateProps) => (
  <View style={styles.empty}>
    <Ionicons name="search-outline" size={40} color={colors.inkFaint} />
    <Text style={styles.emptyText}>Aucun résultat pour « {query} »</Text>
  </View>
);

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.inkMuted,
  },
});
