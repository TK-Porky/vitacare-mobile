import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../../src/themes';
import { TopBar } from '../../../src/components';
import { appointmentService } from '../../../src/services';
import { Appointment } from '../../../src/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'upcoming' | 'past';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmé',   color: '#1A7F3C', bg: '#E8FFF0' },
  pending:   { label: 'En attente', color: '#B45309', bg: '#FFF8ED' },
  paid:      { label: 'Payé',       color: '#1A7F3C', bg: '#E8FFF0' },
  cancelled: { label: 'Annulé',     color: '#B91C1C', bg: '#FFF0F0' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivityCard({ item }: { item: Appointment }) {
  const statusStyle = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.doctorAvatarUri || item.avatarUri }}
        style={styles.avatar}
      />
      <View style={styles.cardBody}>
        <Text style={styles.doctorName}>{item.doctorName}</Text>
        <Text style={styles.specialty}>{item.specialty}</Text>
        <Text style={styles.motif} numberOfLines={1}>{item.motif}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={13} color={colors.inkMuted} />
          <Text style={styles.metaText}>{item.date} · {item.time}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="business-outline" size={13} color={colors.inkMuted} />
          <Text style={styles.metaText}>{item.clinic}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusText, { color: statusStyle.color }]}>
          {statusStyle.label}
        </Text>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="calendar-outline" size={48} color={colors.border} />
      <Text style={styles.emptyTitle}>Aucune activité</Text>
      <Text style={styles.emptySubtitle}>Vos rendez-vous apparaîtront ici.</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [data, setData] = useState<Appointment[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = tab === 'upcoming'
          ? await appointmentService.getUpcomingAppointments()
          : await appointmentService.getPastAppointments();
        if (!mounted) return;
        setData(res as Appointment[]);
      } catch (err) {
        console.warn('Failed to fetch activity appointments', err);
        if (mounted) setData([]);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [tab]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <TopBar title="Mon activité" />

      {/* Tab switcher */}
      <View style={styles.tabs}>
        {(['upcoming', 'past'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'upcoming' ? 'À venir' : 'Passés'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.countLabel}>
          {data.length} rendez-vous
        </Text>

        {data.length === 0 ? (
          <EmptyState />
        ) : (
          data.map((item) => <ActivityCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.inkMuted,
  },
  tabLabelActive: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },

  // List
  list: {
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  countLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.border,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  doctorName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  specialty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  motif: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  emptySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
