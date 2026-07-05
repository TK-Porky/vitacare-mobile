import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components";
import { colors, fontFamily, fontSize } from "@/themes";

type AppointmentErrorViewProps = {
  error: string;
  onRetry: () => void;
};

export const AppointmentErrorView = ({
  error,
  onRetry,
}: AppointmentErrorViewProps) => {
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Rendez-vous" />
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={onRetry}>
          Réessayer
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.danger || "red",
    textAlign: "center",
    marginBottom: 16,
  },
  retryText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
