import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "@/themes";

export const SearchLoading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: { padding: 40, alignItems: "center" },
});
