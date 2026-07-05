import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors, fontFamily, fontSize } from "@/themes";

type SuggestionChipProps = {
  label: string;
  query: string;
  onPress: () => void;
};

export const SuggestionChip = ({
  label,
  query,
  onPress,
}: SuggestionChipProps) => {
  const lower = label.toLowerCase();
  const q = query.toLowerCase();
  const idx = q.length > 0 ? lower.indexOf(q) : -1;

  return (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.7}>
      {idx === -1 || q.length === 0 ? (
        <Text style={styles.chipLabel}>{label}</Text>
      ) : (
        <Text style={styles.chipLabel}>
          {label.slice(0, idx)}
          <Text style={styles.chipLabelBold}>
            {label.slice(idx, idx + query.length)}
          </Text>
          {label.slice(idx + query.length)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "rgba(17, 199, 147, 0.1)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17, 199, 147, 0.3)",
  },
  chipLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primaryDark,
  },
  chipLabelBold: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },
});
