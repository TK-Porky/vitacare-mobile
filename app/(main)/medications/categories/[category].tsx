import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";
import {
  DrugDetailBottomSheet,
  DrugDetailBottomSheetRef,
} from "@/components/medications";
import { DrugCard } from "@/components/medications/DrugCard";
import { DrugCardSkeleton } from "@/components/medications/DrugCardSkeleton";
import { EmptyState } from "@/components/medications/EmptyState";
import { ErrorBanner } from "@/components/medications/ErrorBanner";
import { useMedicationStore } from "@/store/medication.store";
import { useReminders } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";
import { StoreMedicationResponse } from "@/types/api-responses";

export default function CategoryDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const decodedCategory = decodeURIComponent(category || "");
  const [selectedDrug, setSelectedDrug] =
    useState<StoreMedicationResponse | null>(null);
  const drugSheetRef = useRef<DrugDetailBottomSheetRef>(null);

  const {
    medications,
    isLoading,
    error,
    fetchMedications,
    clearError,
  } = useMedicationStore();

  const user = useAuthStore((state) => state.user);
  const { createReminderAsync } = useReminders();

  useEffect(() => {
    fetchMedications();
  }, []);

  const filteredMedications = useMemo(
    () => medications.filter((m) => m.dosageForm === decodedCategory),
    [medications, decodedCategory],
  );

  const handleDrugPress = useCallback((drug: StoreMedicationResponse) => {
    setSelectedDrug(drug);
    drugSheetRef.current?.open();
  }, []);

  const handleAddToReminder = useCallback(
    async (drug: StoreMedicationResponse) => {
      if (!user) {
        Alert.alert(t('common.error'), t('medications.loginRequired'));
        return;
      }
      try {
        await createReminderAsync({
          medicationId: Number(drug.id) || 0,
          medicationName: drug.name,
          form: drug.dosageForm || "COMPRIME",
          dosage: drug.dosage || "",
          frequency: "QUOTIDIEN",
          times: ["08:00"],
          patientId: user?.id ? Number(user.id) : undefined,
          scheduledDate: new Date().toISOString().split("T")[0],
          scheduledTime: "08:00",
          notes: drug.dosageForm ? `Forme: ${drug.dosageForm}` : undefined,
        });
        Alert.alert(t('common.success'), t('medications.addToReminderSuccess', { name: drug.name }), [
          {
            text: t('common.ok'),
            onPress: () => drugSheetRef.current?.close(),
          },
        ]);
      } catch (error) {
        Alert.alert(
          t('common.error'),
          error instanceof Error ? error.message : t('medications.addToReminderError'),
        );
      }
    },
    [user, createReminderAsync],
  );

  const handleRetry = useCallback(() => {
    clearError();
    fetchMedications();
  }, [clearError, fetchMedications]);

  const handleRefresh = useCallback(() => {
    fetchMedications();
  }, [fetchMedications]);

  const isEmpty = !isLoading && filteredMedications.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {decodedCategory}
          </Text>
          <Text style={styles.headerCount}>
            {filteredMedications.length} médicament(s)
          </Text>
        </View>
      </View>

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
        {isLoading && medications.length === 0 ? (
          <View style={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <DrugCardSkeleton key={i} />
            ))}
          </View>
        ) : isEmpty ? (
          <EmptyState isSearching={false} onClearSearch={() => {}} />
        ) : (
          <View style={styles.grid}>
            {filteredMedications.map((drug) => (
              <DrugCard key={drug.id} item={drug} onPress={handleDrugPress} />
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <DrugDetailBottomSheet
        ref={drugSheetRef}
        drug={selectedDrug}
        relatedDrugs={filteredMedications.filter(
          (d) => d.id !== selectedDrug?.id && d.dosageForm === selectedDrug?.dosageForm,
        )}
        onAddToReminder={handleAddToReminder}
        onDrugPress={(drug) => {
          setSelectedDrug(drug as StoreMedicationResponse);
          drugSheetRef.current?.open();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  headerCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
});
