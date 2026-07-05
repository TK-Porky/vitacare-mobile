import { useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  ScrollView,
  StatusBar,
  View,
  Text,
  RefreshControl,
  Alert,
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
import {
  MomoPaymentSheet,
  OrangePaymentSheet,
  CardPaymentSheet,
} from "@/components/payment";
import type { PaymentSheetRef } from "@/components/payment/MomoPaymentSheet";

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AppointmentScreen() {
  const router = useRouter();
  const appointmentRef = useRef<AppointmentDetailBottomSheetRef>(null);

  // Refs pour les sheets de paiement
  const momoSheetRef = useRef<PaymentSheetRef>(null);
  const orangeSheetRef = useRef<PaymentSheetRef>(null);
  const cardSheetRef = useRef<PaymentSheetRef>(null);

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
    markAppointmentAsPaid,
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

  // ── Gestion du paiement ──────────────────────────────────────────────────────

  const handlePay = useCallback(() => {
    if (!selectedItem) return;
    // Ouvrir le sheet de paiement correspondant
    const paymentProvider = selectedItem.paymentProvider || "mobile_money";
    switch (paymentProvider) {
      case "mobile_money":
        momoSheetRef.current?.open();
        break;
      case "orange_money":
        orangeSheetRef.current?.open();
        break;
      case "card":
        cardSheetRef.current?.open();
        break;
      default:
        Alert.alert("Erreur", "Moyen de paiement non reconnu");
    }
  }, [selectedItem]);

  const handlePaymentSuccess = useCallback(async () => {
    if (!selectedAppointmentId) return;
    try {
      await markAppointmentAsPaid(selectedAppointmentId);
      Alert.alert("Succès", "Paiement effectué avec succès !");
      // Rafraîchir la liste
      refresh();
      appointmentRef.current?.close();
      setSelectedItem(undefined);
      setSelectedAppointmentId(undefined);
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible de marquer le paiement comme effectué.",
      );
    }
  }, [selectedAppointmentId, markAppointmentAsPaid, refresh]);

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

      {/* ── BottomSheet de détail avec paiement ── */}
      <AppointmentDetailBottomSheet
        ref={appointmentRef}
        appointment={selectedItem}
        actionVariant={activeTab === "upcoming" ? "reschedule" : "book_again"}
        onReschedule={handleReservation}
        onBookAgain={handleReservation}
        onCancel={handleCancel}
        onShowOnMap={handleShowOnMap}
        onPay={handlePay}
        isCancelling={isCancelling}
      />

      {/* ── Sheets de paiement ── */}
      <MomoPaymentSheet
        ref={momoSheetRef}
        appointmentId={
          selectedAppointmentId ? Number(selectedAppointmentId) : 0
        }
        amount={selectedItem?.total || 0}
        onSuccess={handlePaymentSuccess}
      />
      <OrangePaymentSheet
        ref={orangeSheetRef}
        appointmentId={
          selectedAppointmentId ? Number(selectedAppointmentId) : 0
        }
        amount={selectedItem?.total || 0}
        onSuccess={handlePaymentSuccess}
      />
      <CardPaymentSheet
        ref={cardSheetRef}
        appointmentId={
          selectedAppointmentId ? Number(selectedAppointmentId) : 0
        }
        amount={selectedItem?.total || 0}
        onSuccess={handlePaymentSuccess}
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
    flexGrow: 1,
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
