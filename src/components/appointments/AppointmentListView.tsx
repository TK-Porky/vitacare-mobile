import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Calendar } from "lucide-react-native";
import {
  MonthHeader,
  AppointmentCard,
  AppointmentCardSkeleton,
} from "@/components";
import { colors, fontFamily, fontSize } from "@/themes";
import { Appointment } from "@/types";

type AppointmentListViewProps = {
  isLoading: boolean;
  isRefreshing: boolean;
  appointments: Appointment[];
  activeTab: "upcoming" | "past";
  onRefresh: () => void;
  onCardPress: (item: Appointment) => void;
};

export const AppointmentListView = ({
  isLoading,
  isRefreshing,
  appointments,
  activeTab,
  onRefresh,
  onCardPress,
}: AppointmentListViewProps) => {
  const displayed = appointments.filter((a) =>
    activeTab === "upcoming"
      ? isUpcoming(a.dateTime ?? a.date)
      : !isUpcoming(a.dateTime ?? a.date),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
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
              onPress={() => onCardPress(item)}
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
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isUpcoming(dateTime: string): boolean {
  return new Date(dateTime) >= new Date();
}

function currentMonthLabel(): string {
  const raw = new Date().toLocaleDateString("fr-FR", { month: "long" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const styles = StyleSheet.create({
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
});
