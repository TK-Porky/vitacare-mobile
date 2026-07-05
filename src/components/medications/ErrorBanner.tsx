import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fontFamily, fontSize } from "@/themes";

type ErrorBannerProps = {
  message: string;
  onRetry: () => void;
};

export const ErrorBanner = ({ message, onRetry }: ErrorBannerProps) => {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>{message}</Text>
      <TouchableOpacity onPress={onRetry}>
        <Text style={styles.errorBannerAction}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  errorBannerText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: "#DC2626",
  },
  errorBannerAction: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    marginLeft: 12,
  },
});
