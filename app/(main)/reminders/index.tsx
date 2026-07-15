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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      t("reminders.premiumTitle"),
      t("reminders.premiumMessage"),
      [
        { text: t("common.later"), style: "cancel" },
        { text: t("reminders.premiumSee"), onPress: () => router.push("/premium") },
      ],
    );
  }, [router, t]);

  const handleStorePress = useCallback(() => {
    if (onStore) onStore();
    else router.push("/(main)/(tabs)/medications" as never);
  }, [onStore, router]);

  const handleAdd = useCallback(
    async (data: ReminderData) => {
      try {
        const validationError = validateReminderData(data);
        if (validationError) {
          Alert.alert(t("common.error"), validationError);
          return;
        }

        if (!isHydrated) {
          Alert.alert(t("common.error"), t("reminders.waitProfile"));
          return;
        }

        if (!user) {
          Alert.alert(
            t("common.error"),
            t("reminders.loginRequired"),
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
          t("common.success"),
          t("reminders.addSuccess", { name: data.drugName }),
          [{ text: t("common.ok") }],
        );

        addSheetRef.current?.close();
      } catch (error) {
        console.error("Error creating reminder:", error);
        Alert.alert(
          t("common.error"),
          error instanceof Error
            ? error.message
            : t("reminders.addError"),
        );
      }
    },
    [createReminder, user, isHydrated, t],
  );

  const handleMarkAsTaken = useCallback(
    async (id: string) => {
      try {
        await markAsTaken({ id });
      } catch (error) {
        Alert.alert(t("common.error"), t("reminders.markTakenError"));
      }
    },
    [markAsTaken, t],
  );

  const handleSnooze = useCallback(
    (id: string) => {
      Alert.alert(t("reminders.snoozeTitle"), t("reminders.snoozeTitle"), [
        { text: t("reminders.snooze15min"), onPress: () => snoozeReminder({ id, minutes: 15 }) },
        { text: t("reminders.snooze30min"), onPress: () => snoozeReminder({ id, minutes: 30 }) },
        { text: t("reminders.snooze1hour"), onPress: () => snoozeReminder({ id, minutes: 60 }) },
        { text: t("common.cancel"), style: "cancel" },
      ]);
    },
    [snoozeReminder, t],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        t("reminders.delete"),
        t("reminders.confirmDelete"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: () => deleteReminder(id),
          },
        ],
      );
    },
    [deleteReminder, t],
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
        title={t("reminders.title")}
        onNotification={handleNotificationPress}
        notificationCount={unreadNotificationCount}
        rightActions={
          <PrimaryButton
            label={t("reminders.store")}
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
              ? t("reminders.loadingProfile")
              : t("reminders.loading")}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{t("reminders.error")}</Text>
          <Text style={styles.errorSubtext}>
            {typeof error === "string" ? error : error?.message || t("reminders.error")}
          </Text>
          <PrimaryButton
            label={t("common.retry")}
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
                <Text style={styles.summaryLabel}>{t("reminders.summary.pending")}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.success }]}>
                  {summary.taken}
                </Text>
                <Text style={styles.summaryLabel}>{t("reminders.summary.taken")}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: colors.error }]}>
                  {summary.missed}
                </Text>
                <Text style={styles.summaryLabel}>{t("reminders.summary.missed")}</Text>
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
          accessibilityLabel={t("accessibility.addReminder")}
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
