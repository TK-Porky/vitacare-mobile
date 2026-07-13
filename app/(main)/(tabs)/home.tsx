import React, { useEffect, useRef, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Flame, Pill, TrendingUp } from "lucide-react-native";
import {
  AppHeader,
  ObservanceCard,
  StatCard,
  SectionHeader,
  MedicationItem,
  AppointmentItem,
} from "@/components";
import { colors, fontFamily, fontSize } from "@/themes";
import { useDashboardStore, useAuthStore, useMapStore } from "@/store";
import {
  ErrorScreen,
  SupportContactBottomSheet,
  SupportContactBottomSheetRef,
} from "@/components/errors";

// ================================================================================== //
// Types
// ================================================================================== //
type BoardProps = {
  onMap: () => void;
  notificationBell?: React.ReactNode;
};

// ================================================================================== //
// Main
// ================================================================================== //
export default function DashboardScreen({
  onMap,
  notificationBell,
}: BoardProps) {
  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const { t } = useTranslation();
  const data = useDashboardStore((s) => s.data);
  const isLoading = useDashboardStore((s) => s.isLoading);
  const error = useDashboardStore((s) => s.error);
  const fetchOverview = useDashboardStore((s) => s.fetchOverview);
  const updateMedicationStatus = useDashboardStore((s) => s.updateMedicationStatus);
  const user = useAuthStore((state) => state.user);
  const supportSheetRef = useRef<SupportContactBottomSheetRef>(null);

  // ================================================================================== //
  // Effects
  // ================================================================================== //
  useEffect(() => {
    fetchOverview();
  }, []);

  // ================================================================================== //
  // Handlers
  // ================================================================================== //
  const onRefresh = () => {
    fetchOverview();
  };

  const handleSeeAllMedications = () => {
    router.push("/(main)/(tabs)/medications" as any);
  };

  const handleSeeAllAppointments = () => {
    router.push("/(main)/(tabs)/appointments" as any);
  };

  const handleSearch = () => {
    router.push("/(main)/medications/search" as any);
  };

  const fetchClinics = useMapStore((s) => s.fetchClinics);

  const handleMap = useCallback(() => {
    fetchClinics();
    onMap?.();
  }, [fetchClinics, onMap]);

  const handleNotifications = () => {
    router.push("/(modals)/notifications" as any);
  };

  const closeSupportSheet = () => {
    supportSheetRef.current?.close();
  };

  const handleErrorContactSupport = () => {
    // Fermer l'ErrorScreen si visible
    supportSheetRef.current?.open();
  };

  /**
   * Handle medication press to update status
   */
  const handleMedicationPress = (
    medicationId: number,
    currentStatus: string,
  ) => {
    if (currentStatus !== "pending") return;

    Alert.alert(t('home.medicationTracking'), t('home.didYouTake'), [
      {
        text: t('home.noMissed'),
        style: "destructive",
        onPress: () =>
          updateMedicationStatus({
            medicationId,
            status: "missed",
          }),
      },
      {
        text: t('home.yesTaken'),
        onPress: () =>
          updateMedicationStatus({
            medicationId,
            status: "taken",
            takenAt: new Date().toISOString(),
          }),
      },
      {
        text: t('common.later'),
        style: "cancel",
      },
    ]);
  };

  /**
   * Handle appointment press
   */
  const handleAppointmentPress = (appointmentId: number) => {
    console.log("Navigate to appointment:", appointmentId);
  };

  /**
   * Stable callbacks for list items (prevents re-render of memoized children)
   */
  const medicationHandlers = React.useMemo(
    () => data?.medications.map(m => () => handleMedicationPress(m.id, m.status)) ?? [],
    [data?.medications, handleMedicationPress],
  );

  const appointmentHandlers = React.useMemo(
    () => data?.appointments.slice(0, 3).map(a => () => handleAppointmentPress(a.id)) ?? [],
    [data?.appointments, handleAppointmentPress],
  );

  /**
   * Handle error retry
   */
  const handleErrorRetry = () => {
    fetchOverview();
  };

  /**
   * Handle contact support
   */
  const handleContactSupport = () => {
    supportSheetRef.current?.open();
  };

  // ================================================================================== //
  // Loading / Error – always render structure, never block
  // ================================================================================== //
  const showError = !data && error;
  const showLoading = isLoading && !data;

  // ================================================================================== //
  // Utility Functions
  // ================================================================================== //
  const todayStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const renderSkeletonItem = (key: string) => (
    <View key={key} style={styles.skeletonRow}>
      <View style={[styles.skeletonBlock, { flex: 1, height: 48 }]} />
    </View>
  );

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <View style={styles.root}>
      <StatusBar
        translucent
        backgroundColor={colors.primary}
        barStyle="dark-content"
      />
      <AppHeader
        onSearch={handleSearch}
        onMap={handleMap}
        notificationBell={notificationBell}
        onNotification={handleNotifications}
      />

      {showError && (
        <ErrorScreen
          visible={true}
          type="server"
          title={t('home.cantLoad')}
          message={error!}
          errorCode="ERR-500"
          onRetry={handleErrorRetry}
          onContactSupport={handleContactSupport}
          retryLabel={t('common.retry')}
          showSupport={true}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            {t('home.welcome')}{" "}
            <Text style={styles.greetingName}>
              {user?.fullName || data?.currentUser || "..."}
            </Text>{" "}
            !
          </Text>
          <Text style={styles.greetingDate}>{t('home.today')}, {todayStr}</Text>
        </View>

        {showLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => renderSkeletonItem(String(i)))}
          </>
        ) : data ? (
          <>
            {/* Observance */}
            <ObservanceCard
              remainingDoses={data.stats.pending}
              totalDoses={data.stats.total}
              appointments={data.appointments.length}
              observancePercent={data.stats.observance}
            />

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard
                icon={<Flame size={20} color={colors.inkLight} />}
                value={data.streak}
                label={t('home.streak')}
              />
              <StatCard
                icon={<Pill size={20} color={colors.inkLight} />}
                value={data.activeMedications}
                label={t('home.activeMedications')}
              />
              <StatCard
                icon={<TrendingUp size={20} color={colors.inkLight} />}
                value={`${data.monthlyProgress}%`}
                label={t('home.thisMonth')}
              />
            </View>

            {/* Prises du jour */}
            <View style={styles.section}>
              <SectionHeader
                title={t('home.todayPills')}
                onSeeAll={handleSeeAllMedications}
              />
              {data.medications.length === 0 ? (
                <Text style={styles.emptyText}>{t('home.noPillsScheduled')}</Text>
              ) : (
                <>
                  {data.medications.map((medication, index) => (
                    <MedicationItem
                      key={medication.id}
                      name={medication.name}
                      dose={medication.dosage}
                      status={medication.status}
                      time={medication.time}
                      onPress={medicationHandlers[index]}
                    />
                  ))}
                </>
              )}
            </View>

            {/* Rendez-vous */}
            <View style={styles.section}>
              <SectionHeader
                title={t('home.todayAppointments')}
                onSeeAll={handleSeeAllAppointments}
              />
              {data.appointments.length === 0 ? (
                <Text style={styles.emptyText}>{t('home.noAppointmentScheduled')}</Text>
              ) : (
                <>
                  {data.appointments.slice(0, 3).map((appointment, index) => (
                    <AppointmentItem
                      key={appointment.id}
                      doctorName={appointment.doctorName}
                      date={appointment.date}
                      time={appointment.time}
                      status={appointment.status}
                      avatarUrl={appointment.doctorAvatarUrl ?? undefined}
                      onPress={appointmentHandlers[index]}
                    />
                  ))}
                </>
              )}
            </View>
          </>
        ) : (
          <>
            {Array.from({ length: 6 }).map((_, i) => renderSkeletonItem(String(i)))}
          </>
        )}
      </ScrollView>

      {/* Support Bottom Sheet */}
      <SupportContactBottomSheet ref={supportSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 20,
  },
  skeletonRow: {
    paddingVertical: 8,
  },
  skeletonBlock: {
    backgroundColor: colors.border,
    borderRadius: 8,
    opacity: 0.6,
  },
  greeting: {
    gap: 4,
  },
  greetingText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
  },
  greetingName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.primary,
  },
  greetingDate: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    textAlign: "center",
    paddingVertical: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  section: {
    gap: 12,
  },
});
