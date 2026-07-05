import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { colors, fontFamily, fontSize } from "@/themes";

interface NotificationHeaderProps {
  unreadCount: number;
  onBack: () => void;
  onMarkAllAsRead: () => void;
}

export const NotificationHeader = ({
  unreadCount,
  onBack,
  onMarkAllAsRead,
}: NotificationHeaderProps) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        accessibilityHint="Retour à l'écran précédent"
      >
        <ChevronLeft size={22} color={colors.ink} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
      </Text>
      {unreadCount > 0 ? (
        <TouchableOpacity
          onPress={onMarkAllAsRead}
          style={styles.readAllBtn}
          accessibilityRole="button"
          accessibilityLabel="Tout lire"
          accessibilityHint="Marquer toutes les notifications comme lues"
        >
          <Text style={styles.readAllText}>Tout lire</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerRightPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  readAllBtn: {
    minWidth: 36,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  readAllText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  headerRightPlaceholder: {
    width: 36,
  },
});
