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
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Bell,
  Plus,
  ShoppingBag,
  Pill,
  Info,
  Filter,
} from "lucide-react-native";
import { AppHeader, PrimaryButton } from "@/components";
import { colors, fontFamily, fontSize } from "@/themes";
import {
  AddReminderBottomSheet,
  AddReminderBottomSheetRef,
  ReminderData,
} from "@/components/modals";
import { useReminders } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";
import { ReminderResponse } from "@/types/api-responses";
import { CreateReminderRequest } from "@/types/api-requests";
import { useNotificationStore } from "@/store";

// ================================================================================== //
// Types
// ================================================================================== //
type Reminder = ReminderResponse;
type FilterStatus = "all" | "PENDING" | "TAKEN" | "MISSED" | "SNOOZED";

type Props = {
  onStore?: () => void;
};

const FREE_LIMIT = 5;
const STATUS_LABELS: Record<FilterStatus, string> = {
  all: "Tous",
  PENDING: "En attente",
  TAKEN: "Pris",
  MISSED: "Manqué",
  SNOOZED: "Reporté",
};

// ================================================================================== //
// Helper Functions
// ================================================================================== //

/**
 * Validate reminder data
 */
const validateReminderData = (data: ReminderData): string | null => {
  if (!data.drugName?.trim()) {
    return "Le nom du médicament est requis";
  }
  if (!data.form?.trim()) {
    return "La forme du médicament est requise";
  }
  const dosageValue = parseFloat(data.dosageValue);
  if (!data.dosageValue || isNaN(dosageValue) || dosageValue <= 0) {
    return "Le dosage doit être un nombre supérieur à 0";
  }
  if (!data.dosageUnit?.trim()) {
    return "L'unité de dosage est requise";
  }
  const frequencyCount = parseFloat(data.frequencyCount);
  if (!data.frequencyCount || isNaN(frequencyCount) || frequencyCount <= 0) {
    return "La fréquence doit être un nombre supérieur à 0";
  }
  if (!data.frequencyUnit?.trim()) {
    return "L'unité de fréquence est requise";
  }
  if (!data.time?.trim()) {
    return "L'heure est requise";
  }
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(data.time)) {
    return "L'heure doit être au format HH:MM (ex: 14:30)";
  }
  return null;
};

/**
 * Map ReminderData to CreateReminderRequest - ✅ Format corrigé
 */
const mapReminderDataToRequest = (
  data: ReminderData,
  patientId: string,
  medicationId?: string,
): CreateReminderRequest => {
  const formMap: Record<string, string> = {
    Gelule: "GELULE",
    Comprimé: "COMPRIME",
    Sirop: "SIROP",
    Injectable: "INJECTABLE",
    Pommade: "POMMADE",
    Sachet: "SACHET",
  };

  const frequencyMap: Record<string, string> = {
    Jour: "QUOTIDIEN",
    Semaine: "HEBDOMADAIRE",
    Mois: "MENSUEL",
  };

  const dosage = `${data.dosageValue}${data.dosageUnit}`;
  const times = [data.time];

  return {
    medicationId: Number(medicationId) || 0,
    medicationName: data.drugName,
    form: formMap[data.form] || data.form.toUpperCase(),
    dosage: dosage,
    frequency:
      frequencyMap[data.frequencyUnit] || data.frequencyUnit.toUpperCase(),
    times: times,
    patientId: Number(patientId),
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: data.time,
    notes: `Forme: ${data.form} | Dosage: ${dosage} | Fréquence: ${data.frequencyCount}x/${data.frequencyUnit.toLowerCase()}`,
  };
};

// ================================================================================== //
// Sub-components
// ================================================================================== //

/**
 * Filter tabs component
 */
const FilterTabs = ({
  value,
  onChange,
}: {
  value: FilterStatus;
  onChange: (v: FilterStatus) => void;
}) => {
  const statuses: FilterStatus[] = [
    "all",
    "PENDING",
    "TAKEN",
    "MISSED",
    "SNOOZED",
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {statuses.map((status) => (
        <TouchableOpacity
          key={status}
          style={[styles.filterTab, value === status && styles.filterTabActive]}
          onPress={() => onChange(status)}
          accessibilityLabel={`Filtrer par ${STATUS_LABELS[status]}`}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.filterText,
              value === status && styles.filterTextActive,
            ]}
          >
            {STATUS_LABELS[status]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

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
    accessibilityLabel="Voir les offres premium"
    accessibilityRole="button"
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
 * Reminder card component - ✅ Adapté à la structure API
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

  // ✅ Utiliser les bonnes propriétés de l'API
  const medicationName = item.medicationName || item.name || "Médicament";
  const dosage = item.medicationDosage || item.dosage || "";
  const time = item.scheduledHour || item.time || "Heure non définie";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onView?.(String(item.id))}
      accessibilityLabel={`Rappel pour ${medicationName}`}
      accessibilityRole="button"
    >
      {/* Icon */}
      <View style={styles.cardIcon}>
        <Pill size={20} color={colors.primary} />
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>
            {medicationName}
          </Text>
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
          {dosage && `${dosage} • `}
          {time}
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
            onPress={() => onMarkAsTaken?.(String(item.id))}
            disabled={isMarkingAsTaken}
            accessibilityLabel="Marquer comme pris"
            accessibilityRole="button"
          >
            {isMarkingAsTaken ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>Prendre</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.snoozeButton]}
            onPress={() => onSnooze?.(String(item.id), 15)}
            disabled={isSnoozing}
            accessibilityLabel="Reporter le rappel"
            accessibilityRole="button"
          >
            {isSnoozing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>⏰</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete?.(String(item.id))}
            disabled={isDeleting}
            accessibilityLabel="Supprimer le rappel"
            accessibilityRole="button"
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
// Main Component
// ================================================================================== //

export default function RemindersScreen({ onStore }: Props) {
  const router = useRouter();

  // ================================================================================== //
  // Hooks & Store
  // ================================================================================== //
  const addSheetRef = useRef<AddReminderBottomSheetRef>(null);

  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const unreadNotificationCount = useNotificationStore(
    (state) => state.unreadCount,
  );

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

  const reminderList = reminders ?? [];
  const limitReached = reminderList.length >= FREE_LIMIT;

  // ================================================================================== //
  // Handlers
  // ================================================================================== //

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
    if (onStore) {
      onStore();
    } else {
      router.push("/store");
    }
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

        const medicationId = data.medicationId || "1";
        const requestData = mapReminderDataToRequest(
          data,
          String(user.id),
          medicationId,
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
      router.push(`/reminders/${id}`);
    },
    [router],
  );

  const handleNotificationPress = useCallback(() => {
    router.push("/notifications");
  }, [router]);

  // ================================================================================== //
  // Render States
  // ================================================================================== //

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

  if (error) {
    const errorMessage =
      typeof error === "string"
        ? error
        : error?.message || "Une erreur est survenue";

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Une erreur est survenue</Text>
        <Text style={styles.errorSubtext}>{errorMessage}</Text>
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
        {/* Filters */}
        <FilterTabs value={filterStatus} onChange={setFilterStatus} />

        {/* Limit banner */}
        {limitReached && <LimitBanner onUpgrade={handleUpgrade} />}

        {/* Summary Stats */}
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

        {/* List */}
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

        {/* Pagination Info */}
        {pagination && reminderList.length > 0 && (
          <Text style={styles.paginationText}>
            Affichage {reminderList.length} sur {pagination.total} rappels
          </Text>
        )}
      </ScrollView>

      {/* FAB */}
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

      {/* Add reminder sheet */}
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
  // ... styles existants inchangés
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
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    gap: 8,
    paddingVertical: 4,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  filterTextActive: {
    color: colors.white,
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
  list: {
    gap: 12,
  },
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
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexShrink: 0,
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
  paginationText: {
    textAlign: "center",
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
    marginTop: 16,
    marginBottom: 8,
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
