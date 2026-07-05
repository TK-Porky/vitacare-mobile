// (Optionel)
import { View, Text, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { colors, fontFamily, fontSize } from "@/themes";

export const ToastManager = () => {
  return (
    <Toast
      config={{
        success: ({ text1, text2 }) => (
          <View style={styles.successToast}>
            <Text style={styles.toastTitle}>{text1}</Text>
            {text2 && <Text style={styles.toastBody}>{text2}</Text>}
          </View>
        ),
        error: ({ text1, text2 }) => (
          <View style={styles.errorToast}>
            <Text style={styles.toastTitle}>{text1}</Text>
            {text2 && <Text style={styles.toastBody}>{text2}</Text>}
          </View>
        ),
      }}
    />
  );
};

const styles = StyleSheet.create({
  successToast: {
    backgroundColor: colors.success,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  errorToast: {
    backgroundColor: colors.error,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  toastTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  toastBody: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.white,
    marginTop: 2,
  },
});
