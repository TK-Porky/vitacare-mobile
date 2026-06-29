import { View, Text, StyleSheet } from "react-native";
import { AlertTriangle, Info } from "lucide-react-native";
import { colors, fontFamily, fontSize } from "../../themes";

type Props = {
  message: string;
  type?: "error" | "info";
};

export function HelperText({ message, type = "info" }: Props) {
  const isError = type === "error";

  return (
    <View style={styles.container}>
      {isError ? (
        <AlertTriangle
          fill={colors.error}
          strokeWidth={1.5}
          size={20}
          color={colors.white}
        />
      ) : (
        <Info size={14} color={colors.inkMuted} />
      )}
      <Text style={[styles.text, isError && styles.errorText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingHorizontal: 4,
  },
  text: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.inkMuted,
    flexShrink: 1,
  },
  errorText: {
    color: colors.error,
  },
});
