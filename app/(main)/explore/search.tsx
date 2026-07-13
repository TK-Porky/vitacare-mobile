import React, { useRef, useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";
import { useMapStore } from "@/store";
import { useDebounce } from "@/hooks/useDebounce";

const SUGGESTIONS = [
  "Maux de gorge",
  "Maux d'estomac",
  "Maux de tête",
  "Fièvre",
  "Douleur",
  "Toux",
  "Grippe",
  "Allergie",
  "Urgences",
  "Pédiatrie",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

export default function ExploreSearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const clinics = useMapStore((s) => s.clinics);
  const searchResults = useMapStore((s) => s.searchResults);
  const isSearching = useMapStore((s) => s.isSearching);
  const searchClinics = useMapStore((s) => s.searchClinics);
  const setSelectedClinic = useMapStore((s) => s.setSelectedClinic);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      searchClinics({ query: debouncedQuery });
    }
  }, [debouncedQuery, searchClinics]);

  const providers = useMemo(() => {
    const list = searchResults.length > 0 ? searchResults : clinics;
    if (debouncedQuery.trim().length === 0) return list.slice(0, 10);
    return list;
  }, [clinics, searchResults, debouncedQuery]);

  const suggestions = useMemo(() => {
    if (query.trim().length === 0) return SUGGESTIONS.slice(0, 6);
    return SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query]);

  const handleProviderPress = useCallback(
    (id: string) => {
      const provider = providers.find((c) => c.id === id);
      if (provider) {
        setSelectedClinic(provider);
        router.back();
      }
    },
    [providers, setSelectedClinic, router],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.providerRow}
        activeOpacity={0.75}
        onPress={() => handleProviderPress(item.id)}
      >
        <Image
          source={{ uri: item.avatarUri || "https://via.placeholder.com/48" }}
          style={styles.avatar}
        />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>
            {item.doctorName || item.name}
          </Text>
          <Text style={styles.providerSpecialty}>
            {item.specialty || "Spécialiste"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
      </TouchableOpacity>
    ),
    [handleProviderPress],
  );
  const renderHeader = useCallback(
    () => (
      <>
        {suggestions.length > 0 && query.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Termes suggérés</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.chip}
                  onPress={() => setQuery(s)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipLabel}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {providers.length > 0 && (
          <Text style={styles.sectionLabel}>Meilleures correspondances</Text>
        )}
      </>
    ),
    [suggestions, query, providers.length],
  );
  const renderEmpty = useCallback(
    () =>
      isSearching ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : query.length > 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={40} color={colors.inkFaint} />
          <Text style={styles.emptyText}>
            Aucun résultat pour « {query} »
          </Text>
        </View>
      ) : null,
    [isSearching, query],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Search header ── */}
      <View style={styles.searchHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un professionnel..."
            placeholderTextColor={colors.inkMuted}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={providers}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // ── Header ──
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backBtn: {
    padding: 4,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    padding: 0,
  },

  // ── List ──
  listContent: {
    paddingBottom: 32,
  },

  // ── Sections ──
  section: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },

  // ── Suggestion chips ──
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
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

  // ── Provider rows ──
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  providerInfo: {
    flex: 1,
    gap: 2,
  },
  providerName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  providerSpecialty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },

  // ── Empty ──
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.inkMuted,
  },
});
