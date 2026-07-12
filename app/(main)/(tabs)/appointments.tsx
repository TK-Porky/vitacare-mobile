// app/(main)/(tabs)/appointments.tsx
import React, { useRef, useState, useCallback } from "react";
import { StyleSheet, StatusBar, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "@/themes";
import { Appointment } from "@/types";
import {
  AppointmentDetailBottomSheet,
  AppointmentDetailBottomSheetRef,
} from "@/components/appointments/";
import { AppHeader, TabsSection } from "@/components";
import { useAppointments } from "@/hooks";
import { toSheetData } from "@/utils/mapper";
import { AppointmentListView } from "@/components/appointments/AppointmentListView";
import { AppointmentErrorView } from "@/components/appointments/AppointmentErrorView";
import {
  PaymentSheetManager,
  PaymentSheetManagerRef,
} from "@/components/appointments/PaymentSheetManager";

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
    isCancelling,
    cancelAppointment,
    markAppointmentAsPaid,
  } = useAppointments();

  const paymentManager = useRef<PaymentSheetManagerRef>(null);

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

  const handlePay = useCallback(() => {
    if (!selectedItem) return;
    paymentManager.current?.handlePay(
      selectedItem.paymentProvider || "mobile_money",
    );
  }, [selectedItem]);

  const handlePaymentSuccess = useCallback(async () => {
    if (!selectedAppointmentId) return;
    try {
      await markAppointmentAsPaid(selectedAppointmentId);
      Alert.alert("Succès", "Paiement effectué avec succès !");
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

  // ── Rendu d'erreur ──
  if (error && !isLoading) {
    return <AppointmentErrorView error={error} onRetry={refresh} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.primary} />

      <AppHeader title="Rendez-vous" />

      <TabsSection activeTab={activeTab} onTabChange={setActiveTab} />

      <AppointmentListView
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        appointments={appointments}
        activeTab={activeTab}
        onRefresh={refresh}
        onCardPress={handleCardPress}
      />

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
      <PaymentSheetManager
        ref={paymentManager}
        appointmentId={
          selectedAppointmentId ? Number(selectedAppointmentId) : 0
        }
        amount={selectedItem?.total || 0}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
