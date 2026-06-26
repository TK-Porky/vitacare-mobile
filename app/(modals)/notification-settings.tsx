/**
 * Notification preferences screen.
 * Add to your Profile tab or Settings screen.
 *
 * Usage with Expo Router:
 *   router.push('/(modals)/notification-settings')
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { notificationService } from '../../src/services/notification.service';
import type { NotificationPreferences } from '@vitacare/shared-types';

const LEAD_TIME_OPTIONS = [15, 30, 60, 120, 1440] as const;
function formatLeadTime(mins: number): string {
  if (mins < 60)   return `${mins} minutes avant`;
  if (mins < 1440) return `${mins / 60} heure${mins / 60 > 1 ? 's' : ''} avant`;
  return '1 jour avant';
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [prefs, setPrefs]     = useState<NotificationPreferences | null>(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    notificationService.getPreferences().then(setPrefs);
  }, []);

  const update = async (patch: Partial<NotificationPreferences>) => {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    await notificationService.savePreferences(next);
    setSaving(false);
  };

  if (!prefs) {
    return <ActivityIndicator style={{ flex: 1 }} color="#0D9488" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section: Types */}
        <Text style={styles.sectionLabel}>Types de notifications</Text>
        <View style={styles.card}>
          <Row
            label="Rappels de rendez-vous"
            description="Recevez un rappel avant chaque rendez-vous"
            value={prefs.appointmentReminders}
            onToggle={(v) => update({ appointmentReminders: v })}
          />
          <Divider />
          <Row
            label="Rappels de traitement"
            description="Rappels quotidiens pour prendre vos médicaments"
            value={prefs.treatmentReminders}
            onToggle={(v) => update({ treatmentReminders: v })}
          />
          <Divider />
          <Row
            label="Conseils santé"
            description="Conseils et actualités santé de VitaCare"
            value={prefs.healthTips}
            onToggle={(v) => update({ healthTips: v })}
          />
        </View>

        {/* Section: Lead time */}
        <Text style={styles.sectionLabel}>Délai de rappel des rendez-vous</Text>
        <View style={styles.card}>
          {LEAD_TIME_OPTIONS.map((mins, i) => (
            <React.Fragment key={mins}>
              <TouchableOpacity
                style={styles.leadTimeRow}
                onPress={() => update({ reminderLeadTimeMinutes: mins })}
              >
                <Text style={styles.leadTimeLabel}>{formatLeadTime(mins)}</Text>
                {prefs.reminderLeadTimeMinutes === mins && (
                  <Text style={styles.check}>✓</Text>
                )}
              </TouchableOpacity>
              {i < LEAD_TIME_OPTIONS.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </View>

        {saving && (
          <Text style={styles.savingNote}>Enregistrement…</Text>
        )}
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

interface RowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function Row({ label, description, value, onToggle }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#0D9488' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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

  content: { padding: 16, gap: 6 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
  rowDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 16 },
  leadTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leadTimeLabel: { fontSize: 15, color: '#111827' },
  check: { fontSize: 18, color: '#0D9488', fontWeight: '700' },
  savingNote: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },
});
