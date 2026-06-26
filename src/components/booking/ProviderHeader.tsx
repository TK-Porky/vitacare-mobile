import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../themes';

type Provider = {
  name: string;
  specialty: string;
  avatarUri: string;
  priceXCFA: number;
  location: string;
};

type Props = {
  provider: Provider;
  date: Date | null;
  time: string | null;
};

const DAYS_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const formatDate = (date: Date) =>
  `${DAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

export const ProviderHeader = ({ provider, date, time }: Props) => (
  <View style={styles.providerHeader}>
    <Image source={{ uri: provider.avatarUri }} style={styles.providerAvatar} />
    <View style={styles.providerInfo}>
      <Text style={styles.providerName}>{provider.name}</Text>
      <Text style={styles.providerSpecialty}>{provider.specialty}</Text>
      {date && (
        <View style={styles.providerMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.inkMuted} />
            <Text style={styles.metaText}>{formatDate(date)}</Text>
          </View>
          {time && (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={colors.inkMuted} />
              <Text style={styles.metaText}>A partir de {time}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerInfo: { flex: 1 },
  providerName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    marginBottom: 4,
  },
  providerSpecialty: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: '#64748B',
    marginBottom: 8,
  },
  providerMeta: { gap: 6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  metaText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: '#475569',
  },
});
