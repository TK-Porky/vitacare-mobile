import { useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  ScrollView,
  StatusBar,
  View,
  Text,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, fontFamily, fontSize } from "@/themes";
import { Appointment } from "@/types";
import {
  AppointmentDetailBottomSheet,
  AppointmentDetailBottomSheetRef,
} from "@/components/appointments/";
import {
  AppHeader,
  TabsSection,
  MonthHeader,
  AppointmentCard,
  AppointmentCardSkeleton,
} from "@/components";
import { Calendar } from "lucide-react-native";
import { useAppointments } from "@/hooks";
import { toSheetData, isUpcoming } from "@/utils/mapper";

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AppointmentScreen() {
  const router = useRouter();
  const appointmentRef = useRef<AppointmentDetailBottomSheetRef>(null);

  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedItem, setSelectedItem] = useState<Appointment | undefined>();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | undefined
  >();

  const {
    appointments,
    isLoading,
    isRefreshing,
    error,
    refresh,
    fetchAll,
    isCancelling,
    cancelAppointment,
  } = useAppointments();

  const displayed = appointments.filter((a) =>
    activeTab === "upcoming"
      ? isUpcoming(a.dateTime ?? a.date)
      : !isUpcoming(a.dateTime ?? a.date),
  );

  const handleCardPress = useCallback((item: Appointment) => {
    setSelectedItem(toSheetData(item));
    setSelectedAppointmentId(String(item.id || 0));
    appointmentRef.current?.open();
  }, []);

  const handleCancel = useCallback(async () => {
    if (!selectedAppointmentId) return;

    const success = await cancelAppointment(selectedAppointmentId);
    if (success) {
      appointmentRef.current?.close();
      setSelectedItem(undefined);
      setSelectedAppointmentId(undefined);
    }
  }, [selectedAppointmentId, cancelAppointment]);

  const handleReservation = useCallback(() => {
    router.push("/booking" as never);
  }, [router]);

  const handleShowOnMap = useCallback(() => {
    router.push("/home/map" as never);
  }, [router]);

  // Affichage d'erreur
  if (error && !isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Rendez-vous" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={refresh}>
            Réessayer
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.primary} />

      <AppHeader title="Rendez-vous" />

      <TabsSection activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <>
            <AppointmentCardSkeleton />
            <AppointmentCardSkeleton />
            <AppointmentCardSkeleton />
          </>
        ) : displayed.length > 0 ? (
          <>
            <MonthHeader
              monthLabel={currentMonthLabel()}
              count={displayed.length}
            />
            {displayed.map((item) => (
              <AppointmentCard
                key={item.id}
                item={item}
                onPress={() => handleCardPress(item)}
              />
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Calendar size={40} color={colors.inkLight} />
            </View>
            <Text style={styles.emptyText}>
              {activeTab === "upcoming"
                ? "Aucun rendez-vous à venir"
                : "Aucun rendez-vous passé"}
            </Text>
          </View>
        )}
      </ScrollView>

      <AppointmentDetailBottomSheet
        ref={appointmentRef}
        appointment={selectedItem}
        actionVariant={activeTab === "upcoming" ? "reschedule" : "book_again"}
        onReschedule={handleReservation}
        onBookAgain={handleReservation}
        onCancel={handleCancel}
        onShowOnMap={handleShowOnMap}
        /*isCancelling={isCancelling}*/
      />
    </SafeAreaView>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentMonthLabel(): string {
  const raw = new Date().toLocaleDateString("fr-FR", { month: "long" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.inkLight,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.inkLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.danger || "red",
    textAlign: "center",
    marginBottom: 16,
  },
  retryText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
