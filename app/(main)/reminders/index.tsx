import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, ShoppingBag } from "lucide-react-native";
import { AppHeader, PrimaryButton } from "@/components";
import { colors, fontFamily, fontSize } from "@/themes";
import {
  AddReminderBottomSheet,
  AddReminderBottomSheetRef,
} from "@/components/modals";
import { useReminders } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store";
import { FilterTabs } from "@/components/reminders/FilterTabs";
import { ReminderCard } from "@/components/reminders/ReminderCard";
import { EmptyState } from "@/components/reminders/EmptyState";
import { LimitBanner } from "@/components/reminders/LimitBanner";
import { FilterStatus, FREE_LIMIT } from "@/constants/reminders";
import type { ReminderData } from "@/components/modals";
import type { ReminderResponse } from "@/types/api-responses";
import {
  validateReminderData,
  mapReminderDataToRequest,
} from "@/utils/reminder-helpers";

type Props = { onStore?: () => void };

// ================================================================================== //
// Main Component
// ================================================================================== //

export default function RemindersScreen({ onStore }: Props) {
  const router = useRouter();
  const addSheetRef = useRef<AddReminderBottomSheetRef>(null);

  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const unreadNotificationCount = useNotificationStore(
    (state) => state.unreadCount ?? 0,
  );

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  const {
    reminders,
    summary,
    isLoading: isLoadingReminders,
    isFetching,
    error,
    refetch,
    createReminder,
    isCreating,
    markAsTaken,
    isMarkingAsTaken,
    snoozeReminder,
    isSnoozing,
    deleteReminder,
    isDeleting,
  } = useReminders({
    status: filterStatus === "ALL" ? undefined : filterStatus,
  });

  const reminderList = reminders ?? [];
  const limitReached = reminderList.length >= FREE_LIMIT;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleUpgrade = useCallback(() => {
    Alert.alert(
      "VitaCare Premium",
      "Profitez de rappels illimités avec VitaCare Premium !\n\n" +
        "✨ Rappels illimités\n" +
        "✨ Suivi avancé\n" +
        "✨ Rapports détaillés",
      [
        { text: "Plus tard", style: "cancel" },
        { text: "Voir les offres", onPress: () => router.push("/premium") },
      ],
    );
  }, [router]);

  const handleStorePress = useCallback(() => {
    if (onStore) onStore();
    else router.push("/store");
  }, [onStore, router]);

  const handleAdd = useCallback(
    async (data: ReminderData) => {
      try {
        const validationError = validateReminderData(data);
        if (validationError) {
          Alert.alert("Erreur", validationError);
          return;
        }

        if (!isHydrated) {
          Alert.alert("Erreur", "Veuillez patienter, chargement du profil...");
          return;
        }

        if (!user) {
          Alert.alert(
            "Erreur",
            "Vous devez être connecté pour ajouter un rappel",
          );
          return;
        }

        const requestData = mapReminderDataToRequest(
          data,
          String(user.id),
          data.medicationId || "1",
        );

        console.log("[Reminders] Sending request:", requestData);

        await createReminder(requestData);

        Alert.alert(
          "Succès",
          `Rappel pour ${data.drugName} ajouté avec succès !`,
          [{ text: "OK" }],
        );

        addSheetRef.current?.close();
      } catch (error) {
        console.error("Error creating reminder:", error);
        Alert.alert(
          "Erreur",
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter le rappel",
        );
      }
    },
    [createReminder, user, isHydrated],
  );

  const handleMarkAsTaken = useCallback(
    async (id: string) => {
      try {
        await markAsTaken({ id });
      } catch (error) {
        Alert.alert("Erreur", "Impossible de marquer comme pris");
      }
    },
    [markAsTaken],
  );

  const handleSnooze = useCallback(
    (id: string) => {
      Alert.alert("Reporter le rappel", "Choisissez la durée de report", [
        { text: "15 min", onPress: () => snoozeReminder({ id, minutes: 15 }) },
        { text: "30 min", onPress: () => snoozeReminder({ id, minutes: 30 }) },
        { text: "1 heure", onPress: () => snoozeReminder({ id, minutes: 60 }) },
        { text: "Annuler", style: "cancel" },
      ]);
    },
    [snoozeReminder],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        "Supprimer le rappel",
        "Êtes-vous sûr de vouloir supprimer ce rappel ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => deleteReminder(id),
          },
        ],
      );
    },
    [deleteReminder],
  );

  const handleViewReminder = useCallback(
    (id: string) => {
      router.push(`/medications/reminders/${id}`);
    },
    [router],
  );

  const handleNotificationPress = useCallback(() => {
    router.push("/notifications");
  }, [router]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        title="Mes Rappels"
        onNotification={handleNotificationPress}
        notificationCount={unreadNotificationCount}
        rightActions={
          <PrimaryButton
            label="Magasin"
            onPress={handleStorePress}
            icon={<ShoppingBag size={16} color={colors.white} />}
            size="sm"
            style={{ width: 110 }}
          />
        }
      />

      {!isHydrated || isLoadingReminders ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {!isHydrated
              ? "Chargement du profil..."
              : "Chargement des rappels..."}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Une erreur est survenue</Text>
          <Text style={styles.errorSubtext}>
            {typeof error === "string" ? error : error?.message || "Une erreur est survenue"}
          </Text>
          <PrimaryButton
            label="Réessayer"
            onPress={() => refetch()}
            style={{ marginTop: 16 }}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <FilterTabs value={filterStatus} onChange={setFilterStatus} />

          {limitReached && <LimitBanner onUpgrade={handleUpgrade} />}

          {summary && reminderList.length > 0 && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{summary.pending}</Text>
                <Text style={styles.summaryLabel}>En attente</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.success }]}>
                  {summary.taken}
                </Text>
                <Text style={styles.summaryLabel}>Pris</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.error }]}>
                  {summary.missed}
                </Text>
                <Text style={styles.summaryLabel}>Manqué</Text>
              </View>
            </View>
          )}

          <View style={styles.list}>
            {reminderList.length === 0 ? (
              <EmptyState onAdd={() => addSheetRef.current?.open()} />
            ) : (
              reminderList.map((item: ReminderResponse) => (
                <ReminderCard
                  key={item.id}
                  item={item}
                  onView={handleViewReminder}
                  onMarkAsTaken={handleMarkAsTaken}
                  onSnooze={handleSnooze}
                  onDelete={handleDelete}
                  isMarkingAsTaken={isMarkingAsTaken}
                  isSnoozing={isSnoozing}
                  isDeleting={isDeleting}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}

      {!limitReached && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => addSheetRef.current?.open()}
          disabled={isCreating}
          activeOpacity={0.85}
          accessibilityLabel="Ajouter un rappel"
          accessibilityRole="button"
        >
          {isCreating ? (
            <ActivityIndicator size={24} color={colors.white} />
          ) : (
            <Plus size={28} color={colors.white} />
          )}
        </TouchableOpacity>
      )}

      <AddReminderBottomSheet
        ref={addSheetRef}
        onAdd={handleAdd}
        isSubmitting={isCreating}
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
    backgroundColor: colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 20,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginTop: 12,
  },
  errorText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.error,
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtext: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginBottom: 8,
    textAlign: "center",
  },
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: { alignItems: "center" },
  summaryNumber: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
  },
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
