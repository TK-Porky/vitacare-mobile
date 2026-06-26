import React, { useRef, useState, useCallback, useEffect } from "react";
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
import { Bell, Plus, ShoppingBag, Pill, Info } from "lucide-react-native";
import { AppHeader, PrimaryButton } from "../../../src/components";
import { colors, fontFamily, fontSize } from "../../../src/themes";
import {
  AddReminderBottomSheet,
  AddReminderBottomSheetRef,
  ReminderData,
} from "../../../src/components/modals";
import { useReminders } from "../../../src/hooks";
import { useAuthStore } from "../../../src/store/auth.store";
import { ReminderResponse } from "../../../src/types/api-responses";
import { CreateReminderRequest } from "../../../src/types/api-requests";

// ================================================================================== //
// Types
// ================================================================================== //
type Reminder = ReminderResponse;

type Props = {
  onStore?: () => void;
};

const FREE_LIMIT = 5;
type FilterStatus = "all" | "PENDING" | "TAKEN" | "MISSED";

// ================================================================================== //
// Helper Functions
// ================================================================================== //

/**
 * Map ReminderData to CreateReminderRequest
 */
const mapReminderDataToRequest = (
  data: ReminderData,
  patientId: string,
): CreateReminderRequest => {
  // Create dosage string
  const dosage = `${data.dosageValue}${data.dosageUnit}`;

  return {
    medicationId: "med_" + Date.now(), // You'll need to get this from your medication list
    patientId: patientId,
    scheduledDate: new Date().toISOString().split("T")[0], // Today's date
    scheduledTime: data.time,
    notes: `Forme: ${data.form}, Dosage: ${dosage}, Fréquence: ${data.frequencyCount}x/${data.frequencyUnit.toLowerCase()}`,
  };
};

// ================================================================================== //
// Main Component
// ================================================================================== //
export default function RemindersScreen({ onStore }: Props) {
  // ================================================================================== //
  // Hooks & Store
  // ================================================================================== //
  const addSheetRef = useRef<AddReminderBottomSheetRef>(null);

  // Get user and auth state from the store
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const {
    reminders,
    pagination,
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
    status: filterStatus === "all" ? undefined : filterStatus,
  });

  useEffect(() => {
    refetch();
  }, [filterStatus]);

  const limitReached = reminders?.length >= FREE_LIMIT;

  // ================================================================================== //
  // Handlers
  // ================================================================================== //

  /**
   * Handle adding a new reminder
   */
  const handleAdd = useCallback(
    async (data: ReminderData) => {
      try {
        // Validate required fields
        if (!data.drugName) {
          Alert.alert("Erreur", "Le nom du médicament est requis");
          return;
        }

        // Check if user is authenticated and loaded
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

        // Map the form data to API request
        const requestData = mapReminderDataToRequest(
          data,
          user.id, // Use the user ID from the store
        );

        // Create the reminder
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

  /**
   * Handle marking reminder as taken
   */
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

  /**
   * Handle snoozing a reminder
   */
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

  /**
   * Handle deleting a reminder
   */
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

  /**
   * Handle viewing reminder details
   */
  const handleViewReminder = useCallback((id: string) => {
    // Navigate to detail screen
    // router.push(`/reminders/${id}`);
    console.log("View reminder:", id);
  }, []);

  // ================================================================================== //
  // Render States
  // ================================================================================== //

  // Show loading while auth is hydrating or reminders are loading
  if (!isHydrated || isLoadingReminders) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {!isHydrated
            ? "Chargement du profil..."
            : "Chargement des rappels..."}
        </Text>
      </View>
    );
  }

  // Show error if there's an error fetching reminders
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Une erreur est survenue</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <PrimaryButton
          label="Réessayer"
          onPress={() => refetch()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        title="Mes Rappels"
        rightActions={
          <PrimaryButton
            label="Magasin"
            onPress={onStore}
            icon={<ShoppingBag size={16} color={colors.white} />}
            size="sm"
            style={{ width: 110 }}
          />
        }
      />

      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {/* ── Limit banner ── */}
        {limitReached && (
          <LimitBanner
            onUpgrade={() => {
              /* navigate to premium */
            }}
          />
        )}

        {/* ── Summary Stats ── */}
        {summary && reminders.length > 0 && (
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

        {/* ── List ── */}
        <View style={styles.list}>
          {reminders.length === 0 ? (
            <EmptyState onAdd={() => addSheetRef.current?.open()} />
          ) : (
            reminders.map((item) => (
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

        {/* ── Pagination Info ── */}
        {pagination && reminders.length > 0 && (
          <Text style={styles.paginationText}>
            Affichage {reminders.length} sur {pagination.total} rappels
          </Text>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      {!limitReached && reminders.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => addSheetRef.current?.open()}
          activeOpacity={0.85}
        >
          <Plus size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* ── Add reminder sheet ── */}
      <AddReminderBottomSheet ref={addSheetRef} onAdd={handleAdd} />
    </SafeAreaView>
  );
}

// ================================================================================== //
// Sub-components
// ================================================================================== //

/**
 * Empty state component
 */
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Bell size={40} color={colors.inkLight} />
    </View>
    <Text style={styles.emptyText}>Aucun rappel actif</Text>
    <Text style={styles.emptySubtext}>
      Ajoutez vos médicaments pour ne plus jamais oublier une prise.
    </Text>
    <PrimaryButton
      label="Ajouter un rappel"
      onPress={onAdd}
      style={{ marginTop: 16 }}
      icon={<Plus size={18} color={colors.white} />}
    />
  </View>
);

/**
 * Limit banner component
 */
const LimitBanner = ({ onUpgrade }: { onUpgrade?: () => void }) => (
  <TouchableOpacity
    style={styles.banner}
    activeOpacity={0.85}
    onPress={onUpgrade}
  >
    <View style={styles.bannerIcon}>
      <Info size={18} color={colors.primary} />
    </View>
    <View style={styles.bannerText}>
      <Text style={styles.bannerTitle}>Limite de rappels gratuits</Text>
      <Text style={styles.bannerSubtitle}>
        Passez à VitaCare Premium pour ajouter un nombre illimité de
        médicaments.
      </Text>
    </View>
  </TouchableOpacity>
);

/**
 * Reminder card component
 */
const ReminderCard = ({
  item,
  onView,
  onMarkAsTaken,
  onSnooze,
  onDelete,
  isMarkingAsTaken,
  isSnoozing,
  isDeleting,
}: {
  item: Reminder;
  onView?: (id: string) => void;
  onMarkAsTaken?: (id: string) => void;
  onSnooze?: (id: string, minutes: number) => void;
  onDelete?: (id: string) => void;
  isMarkingAsTaken?: boolean;
  isSnoozing?: boolean;
  isDeleting?: boolean;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "#f39c12";
      case "TAKEN":
        return "#2ecc71";
      case "MISSED":
        return "#e74c3c";
      case "SNOOZED":
        return "#3498db";
      default:
        return "#95a5a6";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "En attente";
      case "TAKEN":
        return "✓ Pris";
      case "MISSED":
        return "✗ Manqué";
      case "SNOOZED":
        return "⏰ Reporté";
      default:
        return status;
    }
  };

  const isActionable = item.status === "PENDING" || item.status === "SNOOZED";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onView?.(item.id)}
    >
      {/* Icon */}
      <View style={styles.cardIcon}>
        <Pill size={20} color={colors.primary} />
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{item.medicationName}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.cardDetails}>
          {item.medicationDosage} • {item.scheduledHour}
        </Text>
        {item.snoozedUntil && (
          <Text style={styles.snoozedText}>
            Reporté jusqu'à: {new Date(item.snoozedUntil).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Actions */}
      {isActionable && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.takenButton]}
            onPress={() => onMarkAsTaken?.(item.id)}
            disabled={isMarkingAsTaken}
          >
            {isMarkingAsTaken ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>Prendre</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.snoozeButton]}
            onPress={() => onSnooze?.(item.id, 15)}
            disabled={isSnoozing}
          >
            {isSnoozing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>⏰</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete?.(item.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>🗑</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Summary stats
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
  summaryItem: {
    alignItems: "center",
  },
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

  // Banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: { flex: 1 },
  bannerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
    lineHeight: 16,
  },

  // List
  list: {
    gap: 12,
  },

  // Empty
  empty: {
    marginTop: "30%",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  emptySubtext: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    textAlign: "center",
    paddingHorizontal: 40,
    marginTop: 8,
    lineHeight: 20,
  },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.ink,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fontFamily.medium,
  },
  cardDetails: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
  },
  snoozedText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  takenButton: {
    backgroundColor: colors.success,
  },
  snoozeButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.white,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },

  // Pagination
  paginationText: {
    textAlign: "center",
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
    marginTop: 16,
    marginBottom: 8,
  },

  // FAB
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
