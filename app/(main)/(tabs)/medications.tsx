import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/themes";
import { SectionHeader, AppHeader } from "@/components";
import {
  DrugDetailBottomSheet,
  DrugDetailBottomSheetRef,
} from "@/components/medications";
import { CategoryCard } from "@/components/medications/CategoryCard";
import { DrugCard } from "@/components/medications/DrugCard";
import { DrugCardSkeleton } from "@/components/medications/DrugCardSkeleton";
import { HeroBanner } from "@/components/medications/HeroBanner";
import { EmptyState } from "@/components/medications/EmptyState";
import { ErrorBanner } from "@/components/medications/ErrorBanner";
import { useMedicationStore } from "@/store/medication.store";
import { useReminders } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";
import { StoreMedicationResponse } from "@/types/api-responses";
import { MedicationScreenProps } from "@/types/medications";

// ================================================================================== //
// Constants
// ================================================================================== //

const HERO_IMAGE_URL =
  "https://www.pharma-gdd.com/media/cache/resolve/slide_original/7508386a20565f5cbc526eee8b3c9f39edeecd576ee90cb3dbb5ce5ac3fe9566b67813d6.jpg";

// ================================================================================== //
// Main
// ================================================================================== //

export default function MedecineScreen({ onReminders }: MedicationScreenProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrug, setSelectedDrug] =
    useState<StoreMedicationResponse | null>(null);
  const drugSheetRef = useRef<DrugDetailBottomSheetRef>(null);

  // Store
  const {
    medications,
    isLoading,
    error,
    searchResults,
    isSearching,
    fetchMedications,
    searchMedications,
    clearSearch,
    clearError,
  } = useMedicationStore();

  // Auth & Reminders
  const user = useAuthStore((state) => state.user);
  const { createReminder } = useReminders();

  // ── Categories ──
  const categories = useMemo(() => {
    const forms = new Set<string>();
    medications.forEach((m) => {
      if (m.dosageForm) forms.add(m.dosageForm);
    });
    return Array.from(forms).map((form, i) => ({
      id: String(i + 1),
      label: form,
      imageUri: "https://via.placeholder.com/150",
    }));
  }, [medications]);

  // ── Effects ──
  useEffect(() => {
    fetchMedications();
  }, []);

  // ── Handlers ──

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        clearSearch();
        return;
      }
      await searchMedications(query);
    },
    [searchMedications, clearSearch],
  );

  const handleSearchSubmit = useCallback(async () => {
    if (searchQuery.trim()) {
      await searchMedications(searchQuery);
    }
  }, [searchQuery, searchMedications]);

  const handleDrugPress = useCallback((drug: StoreMedicationResponse) => {
    setSelectedDrug(drug);
    drugSheetRef.current?.open();
  }, []);

  const handleAddToReminder = useCallback(
    async (drug: StoreMedicationResponse) => {
      if (!user) {
        Alert.alert(
          "Erreur",
          "Vous devez être connecté pour ajouter un rappel",
        );
        return;
      }

      try {
        await createReminder({
          name: drug.name,
          dosage: drug.dosage!,
          times: ["08:00"],
          notes: drug.dosageForm ? `Forme: ${drug.dosageForm}` : undefined,
        });

        Alert.alert(
          "Succès",
          `Le rappel pour ${drug.name} a été ajouté avec succès !`,
          [
            {
              text: "OK",
              onPress: () => {
                drugSheetRef.current?.close();
                if (onReminders) onReminders();
              },
            },
          ],
        );
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter le rappel",
        );
      }
    },
    [user, createReminder, onReminders],
  );

  const handleCategoryPress = useCallback(
    (category: string) => {
      fetchMedications({ searchQuery: category });
    },
    [fetchMedications],
  );

  const handleRetry = useCallback(() => {
    clearError();
    if (isSearching && searchQuery) {
      searchMedications(searchQuery);
    } else {
      fetchMedications();
    }
  }, [
    clearError,
    isSearching,
    searchQuery,
    searchMedications,
    fetchMedications,
  ]);

  const handleRefresh = useCallback(() => {
    clearSearch();
    setSearchQuery("");
    fetchMedications();
  }, [clearSearch, fetchMedications]);

  const handleClearSearch = useCallback(() => {
    clearSearch();
    setSearchQuery("");
  }, [clearSearch]);

  // ── Render Helpers ──

  const displayedMedications = isSearching ? searchResults : medications;
  const isEmpty = !isLoading && displayedMedications.length === 0;

  // ── Render ──

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        searchBar={true}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        onSearch={handleSearchSubmit}
        onFilter={() => {}}
        onReminders={onReminders}
        onSearchFocus={() => {}}
      />

      {error && <ErrorBanner message={error} onRetry={handleRetry} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <HeroBanner
          title="Espace Médicaments"
          subtitle={
            isSearching
              ? `Résultats pour "${searchQuery}"`
              : "Découvrez nos médicaments classés par catégorie."
          }
          imageUrl={HERO_IMAGE_URL}
        />

        {/* Categories */}
        {!isSearching && (
          <>
            <SectionHeader title="Catégories" onSeeAll={() => {}} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  item={cat}
                  onPress={() => handleCategoryPress(cat.label)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Medications Grid */}
        <SectionHeader
          title={isSearching ? "Résultats" : "Médicaments disponibles"}
          onSeeAll={() => {}}
        />

        {isLoading ? (
          <View style={styles.drugsGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <DrugCardSkeleton key={i} />
            ))}
          </View>
        ) : isEmpty ? (
          <EmptyState
            isSearching={isSearching}
            onClearSearch={handleClearSearch}
          />
        ) : (
          <View style={styles.drugsGrid}>
            {displayedMedications.map((drug) => (
              <DrugCard key={drug.id} item={drug} onPress={handleDrugPress} />
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Drug Detail Bottom Sheet */}
      <DrugDetailBottomSheet
        ref={drugSheetRef}
        drug={selectedDrug}
        relatedDrugs={displayedMedications.filter(
          (d) => d.id !== selectedDrug?.id,
        )}
        onAddToReminder={handleAddToReminder}
      />
    </SafeAreaView>
  );
}

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  categoriesRow: {
    gap: 12,
    marginBottom: 24,
    marginTop: 12,
  },
  drugsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
    marginTop: 12,
  },
});
