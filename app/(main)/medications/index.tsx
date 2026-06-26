// screens/medications/MedecineScreen.tsx (updated to use the store)

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ImageBackground,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "../../../src/themes";
import { SectionHeader, AppHeader } from "../../../src/components";
import {
  DrugDetailBottomSheet,
  DrugDetailBottomSheetRef,
} from "../../../src/components/medications";
import { useMedicationStore } from "../../../src/store/medication.store";
import { useReminders } from "../../../src/hooks";
import { useAuthStore } from "../../../src/store/auth.store";
import { StoreMedicationResponse } from "../../../src/types/api-responses";

// ================================================================================== //
// Types
// ================================================================================== //
type Props = {
  onReminders?: () => void;
};

// ================================================================================== //
// Components
// ================================================================================== //

/**
 * Category card component
 */
function CategoryCard({ item, onPress }: { item: any; onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={styles.categoryCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Image
        source={{ uri: item.imageUri }}
        style={styles.categoryImage}
        resizeMode="cover"
      />
      <View style={styles.categoryLabelRow}>
        <Text style={styles.categoryLabel}>{item.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Drug card component
 */
function DrugCard({
  item,
  onPress,
  hasReminder,
}: {
  item: StoreMedicationResponse;
  onPress?: (drug: StoreMedicationResponse) => void;
  hasReminder?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.drugCard}
      activeOpacity={0.85}
      onPress={() => onPress?.(item)}
    >
      <View style={styles.drugImageContainer}>
        <Image
          source={{ uri: item.imageUrl || "https://via.placeholder.com/150" }}
          style={styles.drugImage}
          resizeMode="cover"
        />
        {hasReminder && (
          <View style={styles.reminderBadge}>
            <Text style={styles.reminderBadgeText}>🔔</Text>
          </View>
        )}
      </View>
      <View style={styles.drugInfo}>
        <Text style={styles.drugCategory}>{item.dosageForm || "Médicament"}</Text>
        <Text style={styles.drugName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.referencePrice != null && <Text style={styles.drugPrice}>{item.referencePrice} FCFA</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ================================================================================== //
// Main
// ================================================================================== //
export default function MedecineScreen({ onReminders }: Props) {
  // ================================================================================== //
  // Hooks & State
  // ================================================================================== //
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

  // ── Categories dérivées des dosageForm ──
  const categories = React.useMemo(() => {
    const forms = new Set<string>();
    medications.forEach(m => { if (m.dosageForm) forms.add(m.dosageForm); });
    return Array.from(forms).map((form, i) => ({
      id: String(i + 1),
      label: form,
      imageUri: "https://via.placeholder.com/150",
    }));
  }, [medications]);

  // ================================================================================== //
  // Effects
  // ================================================================================== //

  useEffect(() => {
    fetchMedications();
  }, []);

  // ================================================================================== //
  // Functions
  // ================================================================================== //

  /**
   * Handle search
   */
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      clearSearch();
      return;
    }

    await searchMedications(query);
  };

  /**
   * Handle search submission
   */
  const handleSearchSubmit = async () => {
    if (searchQuery.trim()) {
      await searchMedications(searchQuery);
    }
  };

  /**
   * Handle drug card press
   */
  const handleDrugPress = (drug: StoreMedicationResponse) => {
    setSelectedDrug(drug);
    drugSheetRef.current?.open();
  };

  /**
   * Handle adding drug to reminders
   */
  const handleAddToReminder = async (drug: StoreMedicationResponse) => {
    if (!user) {
      Alert.alert("Erreur", "Vous devez être connecté pour ajouter un rappel");
      return;
    }

    try {
      await createReminder({
        medicationId: drug.id,
        patientId: user.id,
        scheduledDate: new Date().toISOString().split("T")[0],
        scheduledTime: "08:00",
        notes: `Médicament: ${drug.name}${drug.dosageForm ? `, Forme: ${drug.dosageForm}` : ""}`,
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
  };

  /**
   * Handle category press
   */
  const handleCategoryPress = (category: string) => {
    fetchMedications({ searchQuery: category });
  };

  /**
   * Handle retry on error
   */
  const handleRetry = () => {
    clearError();
    if (isSearching && searchQuery) {
      searchMedications(searchQuery);
    } else {
      fetchMedications();
    }
  };

  // ================================================================================== //
  // Render Helpers
  // ================================================================================== //

  const displayedMedications = isSearching ? searchResults : medications;
  const isEmpty = !isLoading && displayedMedications.length === 0;

  // ================================================================================== //
  // Render
  // ================================================================================== //

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

      {/** 
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={handleRetry}>
            <Text style={styles.errorBannerAction}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}
      */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              clearSearch();
              setSearchQuery("");
              fetchMedications();
            }}
          />
        }
      >
        {/* ── Hero Banner ── */}
        <TouchableOpacity activeOpacity={0.9} style={styles.heroBannerWrapper}>
          <ImageBackground
            source={{
              uri: "https://www.pharma-gdd.com/media/cache/resolve/slide_original/7508386a20565f5cbc526eee8b3c9f39edeecd576ee90cb3dbb5ce5ac3fe9566b67813d6.jpg",
            }}
            style={styles.heroBanner}
            imageStyle={styles.heroBannerImage}
          >
            <View style={styles.heroBannerOverlay}>
              <Text style={styles.heroTitle}>Espace Médicaments</Text>
              <Text style={styles.heroSubtitle}>
                {isSearching
                  ? `Résultats pour "${searchQuery}"`
                  : "Découvrez nos médicaments classés par catégorie."}
              </Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* ── Categories (only show when not searching) ── */}
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

        {/* ── Medications Grid ── */}
        <SectionHeader
          title={isSearching ? "Résultats" : "Médicaments disponibles"}
          onSeeAll={() => {}}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medkit-outline" size={48} color={colors.inkLight} />
            <Text style={styles.emptyText}>
              {isSearching
                ? "Aucun médicament trouvé"
                : "Aucun médicament disponible"}
            </Text>
            {isSearching && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => {
                  clearSearch();
                  setSearchQuery("");
                }}
              >
                <Text style={styles.clearSearchButtonText}>
                  Effacer la recherche
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.drugsGrid}>
            {displayedMedications.map((drug) => (
              <DrugCard key={drug.id} item={drug} onPress={handleDrugPress} />
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Drug Detail Bottom Sheet ── */}
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
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    marginTop: 12,
    textAlign: "center",
  },
  clearSearchButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearSearchButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  errorBannerText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: "#DC2626",
  },
  errorBannerAction: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    marginLeft: 12,
  },
  heroBannerWrapper: {
    marginTop: 4,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  heroBanner: {
    height: 160,
    justifyContent: "flex-end",
  },
  heroBannerImage: {
    borderRadius: 20,
  },
  heroBannerOverlay: {
    backgroundColor: "rgba(10, 30, 20, 0.5)",
    padding: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.white,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 18,
  },
  categoriesRow: {
    gap: 12,
    marginBottom: 24,
    marginTop: 12,
  },
  categoryCard: {
    width: 120,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryImage: {
    width: "100%",
    height: 80,
    backgroundColor: colors.surface,
  },
  categoryLabelRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.ink,
  },
  drugsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
    marginTop: 12,
  },
  drugCard: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },
  drugImageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: colors.surface,
    position: "relative",
  },
  drugImage: {
    width: "100%",
    height: "100%",
  },
  reminderBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(46, 204, 113, 0.9)",
    borderRadius: 12,
    padding: 4,
    paddingHorizontal: 8,
  },
  reminderBadgeText: {
    fontSize: 12,
  },
  drugInfo: {
    padding: 12,
  },
  drugCategory: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    marginBottom: 4,
  },
  drugName: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
    marginBottom: 6,
    lineHeight: 18,
  },
  drugPrice: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
});
