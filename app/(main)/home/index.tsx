import React, { useEffect } from "react";
import { ScrollView, View, Text, StyleSheet, StatusBar, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { router } from "expo-router";
import { Flame, Pill, TrendingUp } from "lucide-react-native";
import {
  AppHeader,
  ObservanceCard,
  StatCard,
  SectionHeader,
  MedicationItem,
  AppointmentItem,
  HelperText,
} from "../../../src/components";
import { colors, fontFamily, fontSize } from "../../../src/themes";
import { useDashboardStore, useAuthStore } from "../../../src/store";

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
export default function DashboardScreen({ onMap, notificationBell }: BoardProps) {
  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const { data, isLoading, error, fetchOverview, updateMedicationStatus } = useDashboardStore();
  const user = useAuthStore(state => state.user);

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
    router.push("/(main)/(tabs)/explore" as any);
  };

  /**
   * Handle medication press to update status
   */
  const handleMedicationPress = (medicationId: number, currentStatus: string) => {
    if (currentStatus !== 'pending') return;

    Alert.alert(
      "Suivi de prise",
      "Avez-vous pris ce médicament ?",
      [
        {
          text: "Non, manqué",
          style: "destructive",
          onPress: () => updateMedicationStatus({ 
            medicationId, 
            status: 'missed' 
          }),
        },
        {
          text: "Oui, pris",
          onPress: () => updateMedicationStatus({ 
            medicationId, 
            status: 'taken',
            takenAt: new Date().toISOString()
          }),
        },
        {
          text: "Plus tard",
          style: "cancel"
        }
      ]
    );
  };

  /**
   * Handle appointment press
   */
  const handleAppointmentPress = (appointmentId: number) => {
    // In a real app, navigate to appointment details
    // router.push({ pathname: "/(main)/appointments/[id]", params: { id: appointmentId } } as any);
    console.log("Navigate to appointment:", appointmentId);
  };

  // ================================================================================== //
  // Loading Render
  // ================================================================================== //
  if (isLoading && !data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ================================================================================== //
  // Error Render
  // ================================================================================== //
  if (!data && error) {
    return (
      <View style={styles.errorContainer}>
        <HelperText message={error} type="error" />
        <Text style={styles.retry} onPress={() => fetchOverview()}>Réessayer</Text>
      </View>
    );
  }

  if (!data) return null;

  // ================================================================================== //
  // Utility Functions
  // ================================================================================== //
  const todayStr = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

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
      <AppHeader onSearch={handleSearch} onMap={onMap} notificationBell={notificationBell} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            Bienvenue <Text style={styles.greetingName}>{user?.fullName || data.currentUser}</Text> !
          </Text>
          <Text style={styles.greetingDate}>Aujourd'hui, {todayStr}</Text>
        </View>

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
            label={"Jours\nConsécutifs"}
          />
          <StatCard
            icon={<Pill size={20} color={colors.inkLight} />}
            value={data.activeMedications}
            label={"Médicaments\nactifs"}
          />
          <StatCard
            icon={<TrendingUp size={20} color={colors.inkLight} />}
            value={`${data.monthlyProgress}%`}
            label="Ce mois-ci"
          />
        </View>

        {/* Prises du jour */}
        <View style={styles.section}>
          <SectionHeader title="Prises du jour" onSeeAll={handleSeeAllMedications} />
          {data.medications.length === 0 ? (
            <Text style={styles.emptyText}>Aucune prise programmée</Text>
          ):(
            <>
              {data.medications.map((medication) => (
                <MedicationItem
                key={medication.id}
                name={medication.name}
                dose={medication.dosage}
                status={medication.status}
                time={medication.time}
                onPress={() => handleMedicationPress(medication.id, medication.status)}
              />
              ))}
            </>
          )}
        </View>

        {/* Rendez-vous */}
        <View style={styles.section}>
          <SectionHeader title="Vos Rendez-vous" onSeeAll={handleSeeAllAppointments} />
          {data.appointments.length === 0 ? (
            <Text style={styles.emptyText}>Aucun rendez-vous prévu</Text>
          ):(
            <>
              {data.appointments.slice(0, 3).map((appointment) => {
                const dateStr = appointment.date;
                const timeStr = appointment.time;

                return (
                  <AppointmentItem
                    key={appointment.id}
                    doctorName={appointment.doctorName}
                    date={dateStr}
                    time={timeStr}
                    status={appointment.status}
                    avatarUrl={appointment.doctorAvatarUrl ?? undefined}
                    onPress={() => handleAppointmentPress(appointment.id)}
                  />
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.surface,
    gap: 12,
  },
  retry: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
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

