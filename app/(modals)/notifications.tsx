import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../src/hooks/useNotifications';
import type { VitaCareNotification, NotificationCategory } from '@vitacare/shared-types';

// ── Category helpers ──────────────────────────────────────────────────────

const CATEGORY_META: Record<
  NotificationCategory,
  { icon: string; color: string; label: string }
> = {
  appointment_reminder:  { icon: '🗓',  color: '#0D9488', label: 'Rendez-vous' },
  appointment_confirmed: { icon: '✅',  color: '#16A34A', label: 'Confirmé' },
  appointment_cancelled: { icon: '❌',  color: '#DC2626', label: 'Annulé' },
  treatment_reminder:    { icon: '💊',  color: '#7C3AED', label: 'Traitement' },
  treatment_refill:      { icon: '🔄',  color: '#EA580C', label: 'Renouvellement' },
  health_tip:            { icon: '💡',  color: '#CA8A04', label: 'Conseil santé' },
  system:                { icon: 'ℹ️',  color: '#6B7280', label: 'Système' },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)  return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days  = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

// ── NotificationItem ──────────────────────────────────────────────────────

interface ItemProps {
  notification: VitaCareNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onRead, onDelete }: ItemProps) {
  const meta    = CATEGORY_META[notification.category] ?? CATEGORY_META.system;
  const isUnread = !notification.readAt;

  return (
    <TouchableOpacity
      style={[styles.item, isUnread && styles.itemUnread]}
      onPress={() => onRead(notification.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.color + '18' }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
      </View>

      <View style={styles.itemBody}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, isUnread && styles.itemTitleBold]}>
            {notification.title}
          </Text>
          {isUnread && <View style={[styles.dot, { backgroundColor: meta.color }]} />}
        </View>
        <Text style={styles.itemDesc} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.itemTime}>
          {formatRelative(notification.createdAt)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(notification.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    inbox,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();

  const renderItem = useCallback(
    ({ item }: { item: VitaCareNotification }) => (
      <NotificationItem
        notification={item}
        onRead={markAsRead}
        onDelete={deleteNotification}
      />
    ),
    [markAsRead, deleteNotification],
  );

  const ListEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptyBody}>
        Vos rappels de rendez-vous et de traitement apparaîtront ici.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={styles.readAllBtn}>
            <Text style={styles.readAllBtnText}>Tout lire</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#0D9488" />
      ) : (
        <FlatList
          data={inbox}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={inbox.length === 0 && styles.emptyList}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#0D9488" />
          }
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  backBtn: { width: 40 },
  backBtnText: { fontSize: 22, color: '#0D9488' },
  readAllBtn: { paddingHorizontal: 4 },
  readAllBtnText: { fontSize: 14, color: '#0D9488', fontWeight: '600' },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 18 },
  itemBody: { flex: 1 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  itemTitle: { fontSize: 14, color: '#374151', flex: 1 },
  itemTitleBold: { fontWeight: '600', color: '#111827' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  itemDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  itemTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  deleteBtn: { padding: 2 },
  deleteBtnText: { color: '#D1D5DB', fontSize: 14 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyList: { flex: 1 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});
