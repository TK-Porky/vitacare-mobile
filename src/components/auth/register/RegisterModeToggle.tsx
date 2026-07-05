import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";
import { RegisterMode } from "@/utils/register-validation";

type RegisterModeToggleProps = {
  mode: RegisterMode;
  onModeChange: (mode: RegisterMode) => void;
};

export const RegisterModeToggle = ({
  mode,
  onModeChange,
}: RegisterModeToggleProps) => {
  const modes: RegisterMode[] = ["phone", "email"];

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>
        Mode d'inscription <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.toggle}>
        {modes.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
            onPress={() => onModeChange(m)}
            activeOpacity={0.7}
            accessibilityLabel={`S'inscrire par ${m === "phone" ? "téléphone" : "email"}`}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === m }}
          >
            <Ionicons
              name={m === "phone" ? "call-outline" : "mail-outline"}
              size={16}
              color={mode === m ? colors.black : colors.inkLight}
            />
            <Text
              style={[
                styles.toggleLabel,
                mode === m && styles.toggleLabelActive,
              ]}
            >
              {m === "phone" ? "Téléphone" : "Email"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldWrapper: { gap: 6 },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  required: {
    color: colors.error || "#E53935",
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.black,
  },
  toggleLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  toggleLabelActive: {
    color: colors.black,
  },
});
