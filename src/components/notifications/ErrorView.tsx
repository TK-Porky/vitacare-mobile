import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export const ErrorView = ({ message, onRetry, onDismiss }: ErrorViewProps) => {
  return (
    <SafeAreaView style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Oups !</Text>
        <Text style={styles.errorMessage}>{message}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissBtnText}>Ignorer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: 16,
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  errorMessage: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: "row",
    gap: 16,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semiBold,
    color: colors.white,
  },
  dismissBtn: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dismissBtnText: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
});
