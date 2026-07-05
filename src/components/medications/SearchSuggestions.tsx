import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, fontFamily, fontSize } from "@/themes";
import { SuggestionChip } from "./SuggestionChip";

type SearchSuggestionsProps = {
  suggestions: string[];
  query: string;
  onSuggestionPress: (text: string) => void;
};

export const SearchSuggestions = ({
  suggestions,
  query,
  onSuggestionPress,
}: SearchSuggestionsProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>Termes suggérés</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      {suggestions.map((s) => (
        <SuggestionChip
          key={s}
          label={s}
          query={query}
          onPress={() => onSuggestionPress(s)}
        />
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  section: { marginBottom: 4 },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    paddingTop: 16,
    paddingBottom: 10,
  },
  chipsRow: { gap: 8, paddingBottom: 4 },
});
