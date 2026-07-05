import { useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, fontFamily, fontSize } from "@/themes";
import { Drug } from "@/types";
import { medicationService } from "@/services";
import { SearchHeader } from "@/components/medications/SearchHeader";
import { SearchDrugCard } from "@/components/medications/SearchDrugCard";
import { SearchSuggestions } from "@/components/medications/SearchSuggestions";
import { SearchEmptyState } from "@/components/medications/SearchEmptyState";
import { SearchLoading } from "@/components/medications/SearchLoading";
import { ALL_SUGGESTIONS, CARD_GAP } from "@/constants/medications-search";

// ================================================================================== //
// Main
// ================================================================================== //

export default function MedicationsSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Drug[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const suggestions = useMemo(() => {
    if (query.trim().length === 0) return ALL_SUGGESTIONS.slice(0, 6);
    return ALL_SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query]);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await medicationService.searchMedications(text);
      setResults(data as Drug[]);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSuggestionPress = useCallback(
    (text: string) => {
      handleSearch(text);
    },
    [handleSearch],
  );

  const handleDrugPress = useCallback((item: Drug) => {
    // TODO: Navigate to drug detail
    console.log("Drug pressed:", item.name);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Drug; index: number }) => (
      <View
        style={[
          styles.cardWrap,
          index % 2 === 0 ? styles.cardLeft : styles.cardRight,
        ]}
      >
        <SearchDrugCard item={item} onPress={handleDrugPress} />
      </View>
    ),
    [handleDrugPress],
  );

  const renderHeader = useCallback(() => {
    if (suggestions.length > 0 && results.length === 0) {
      return (
        <SearchSuggestions
          suggestions={suggestions}
          query={query}
          onSuggestionPress={handleSuggestionPress}
        />
      );
    }
    if (results.length > 0) {
      return <Text style={styles.sectionLabel}>Résultats</Text>;
    }
    return null;
  }, [suggestions, query, results.length, handleSuggestionPress]);

  const renderEmpty = useCallback(() => {
    if (query.trim() && !isSearching) {
      return <SearchEmptyState query={query} />;
    }
    if (isSearching) {
      return <SearchLoading />;
    }
    return null;
  }, [query, isSearching]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <SearchHeader
        query={query}
        onQueryChange={handleSearch}
        onClear={handleClear}
        onBack={handleBack}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  row: { gap: CARD_GAP, marginBottom: CARD_GAP },
  cardWrap: { flex: 1 },
  cardLeft: { marginRight: CARD_GAP / 2 },
  cardRight: { marginLeft: CARD_GAP / 2 },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    paddingTop: 16,
    paddingBottom: 10,
  },
});
