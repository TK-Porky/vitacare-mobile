import React, { useCallback, useMemo } from "react";
import Toast from "react-native-toast-message";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, fontFamily, fontSize } from "@/themes";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationCategory, NotificationData } from "@/types";
import { ChevronLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatRelative, CATEGORY_META } from "@/utils";

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}

function ErrorView({ message, onRetry, onDismiss }: ErrorViewProps) {
  return (
    <SafeAreaView style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Oups !</Text>
        <Text style={styles.errorMessage}>{message}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissBtnText}>Ignorer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface NotificationItemProps {
  notification: NotificationData;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: NotificationItemProps) {
  const meta =
    CATEGORY_META[notification.type as NotificationCategory] ??
    CATEGORY_META.system;
  const isUnread = !notification.read;
  const timeLabel = useMemo(
    () => formatRelative(notification.createdAt),
    [notification.createdAt],
  );
  const handlePress = useCallback(() => {
    onRead(notification.id!);
  }, [notification.id, onRead]);

  const handleDelete = useCallback(() => {
    onDelete(notification.id!);
  }, [notification.id, onDelete]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Bloc gauche */}
      <View style={[styles.cardLeft, { backgroundColor: meta.color }]}>
        {isUnread && <View style={styles.unreadDot} />}
        <Ionicons name={meta.icon} size={22} color="#fff" />
        <Text style={styles.leftLabel}>{meta.label}</Text>
      </View>

      {/* Contenu */}
      <View style={styles.cardContent}>
        <Text
          style={[styles.notifTitle, !isUnread && styles.notifTitleRead]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>
          {notification.content}
        </Text>
        <Text style={styles.notifTime}>{timeLabel}</Text>
      </View>

      {/* Suppression */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function ListEmpty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="notifications-outline"
          size={36}
          color={colors.inkLight}
        />
      </View>
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptyBody}>
        Vos rappels de rendez-vous et de traitement apparaîtront ici.
      </Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    inbox,
    unreadCount,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    loadMore,
    clearError,
  } = useNotifications();

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteNotification(id);
        Toast.show({
          type: "success",
          text1: "Notification supprimée",
          position: "bottom",
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Impossible de supprimer la notification",
          position: "bottom",
        });
      }
    },
    [deleteNotification],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationData }) => (
      <NotificationItem
        notification={item}
        onRead={markAsRead}
        onDelete={handleDelete}
      />
    ),
    [markAsRead, handleDelete],
  );

  const handleMarkAllAsRead = useCallback(() => {
    Alert.alert(
      "Marquer tout comme lu",
      "Voulez-vous marquer toutes les notifications comme lues ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", onPress: markAllAsRead },
      ],
    );
  }, [markAllAsRead]);

  const keyExtractor = useCallback(
    (item: NotificationData, index: number) =>
      item.id || `notification-${index}`,
    [],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Chargement...</Text>
      </View>
    );
  }, [isLoadingMore]);

  const renderEndOfList = useCallback(() => {
    if (isLoadingMore) return null;

    if (inbox.length > 0 && !hasMore) {
      return (
        <View style={styles.endOfList}>
          <Text style={styles.endOfListText}>
            Toutes les notifications sont chargées
          </Text>
        </View>
      );
    }

    return null;
  }, [inbox.length, hasMore, isLoadingMore]);

  if (error) {
    return (
      <ErrorView message={error} onRetry={refresh} onDismiss={clearError} />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
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
            onPress={handleMarkAllAsRead}
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

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={inbox}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          onEndReached={loadMore}
          onEndReachedThreshold={hasMore ? 0.5 : undefined}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={
            <>
              {renderFooter()}
              {renderEndOfList()}
            </>
          }
          contentContainerStyle={[
            styles.listContent,
            inbox.length === 0 && styles.listEmpty,
            inbox.length > 0 && inbox.length < 3 && styles.listMinimal,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // Header
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

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  listContent: {
    padding: 12,
  },
  listMinimal: {
    paddingVertical: 12,
  },
  listEmpty: {
    flex: 1,
  },

  // Footer de chargement
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 12,
  },
  footerText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },

  // Fin de liste
  endOfList: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endOfListText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },

  // Card
  card: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 88,
    backgroundColor: colors.white,
  },

  // Bloc gauche
  cardLeft: {
    width: 66,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    position: "relative",
    borderRadius: 14,
  },
  unreadDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    opacity: 0.9,
  },
  leftLabel: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    color: colors.white,
    textAlign: "center",
    lineHeight: 13,
  },
  leftTime: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    fontSize: 9,
    fontFamily: fontFamily.regular,
    color: colors.gray200,
    textAlign: "center",
  },

  // Bloc droit
  cardContent: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
    paddingVertical: 11,
    paddingHorizontal: 12,
    minWidth: 0,
  },
  dimmed: {
    opacity: 0.68,
  },
  deleteBtn: {
    paddingRight: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
  },
  notifTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
    lineHeight: 18,
  },
  notifTitleRead: {
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },
  notifBody: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    lineHeight: 17,
  },
  notifTime: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    marginTop: 2,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  emptyBody: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 20,
  },

  // Error
  errorContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: 16,
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  errorMessage: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: "row",
    gap: 16,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semiBold,
    color: colors.white,
  },
  dismissBtn: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dismissBtnText: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
});
