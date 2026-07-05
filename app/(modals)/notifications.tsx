import { useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { colors } from "@/themes";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationData } from "@/types";
import { ErrorView } from "@/components/notifications/ErrorView";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationHeader } from "@/components/notifications/NotificationHeader";
import { EmptyState } from "@/components/notifications/EmptyState";
import { ListFooter } from "@/components/notifications/ListFooter";

// ─── Screen ────────────────────────────────────────────────────────────────────

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

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const keyExtractor = useCallback(
    (item: NotificationData, index: number) =>
      item.id || `notification-${index}`,
    [],
  );

  if (error) {
    return (
      <ErrorView message={error} onRetry={refresh} onDismiss={clearError} />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <NotificationHeader
        unreadCount={unreadCount}
        onBack={handleBack}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

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
          ListEmptyComponent={EmptyState}
          ListFooterComponent={
            <ListFooter
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              inboxLength={inbox.length}
            />
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
});
