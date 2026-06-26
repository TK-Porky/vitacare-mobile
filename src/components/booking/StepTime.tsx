import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../themes';
import { StepLabel } from './StepLabel';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  slots?: string[];
  selected: string | null;
  onSelect: (time: string) => void;
};

// ─── Main component ───────────────────────────────────────────────────────────

export const StepTime = ({ slots, selected, onSelect }: Props) => {
  const sorted = useMemo(() => {
    if (!slots || slots.length === 0) return [];
    return [...slots].sort();
  }, [slots]);

  if (slots === undefined) {
    return (
      <View style={styles.container}>
        <StepLabel number={2} label="Choisissez l'heure" />
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={40} color={colors.inkFaint} />
          <Text style={styles.emptyText}>Veuillez d'abord sélectionner une date</Text>
        </View>
      </View>
    );
  }

  if (sorted.length === 0) {
    return (
      <View style={styles.container}>
        <StepLabel number={2} label="Choisissez l'heure" />
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={40} color={colors.inkFaint} />
          <Text style={styles.emptyText}>Aucun créneau disponible pour cette date</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StepLabel number={2} label="Choisissez l'heure" />
      {selected && (
        <View style={styles.displayCard}>
          <Ionicons name="time-outline" size={22} color={colors.primary} />
          <Text style={styles.displayTime}>{selected.replace(':', 'h')}</Text>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {sorted.map((time) => {
            const isSel = time === selected;
            return (
              <TouchableOpacity key={time} activeOpacity={0.7}
                onPress={() => onSelect(time)}
                style={[styles.chip, isSel && styles.chipSelected]}>
                <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                  {time.replace(':', 'h')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  displayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.primary + '0A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
  },
  displayTime: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    color: colors.ink,
    letterSpacing: 3,
  },

  scrollContent: {
    paddingBottom: 16,
  },

  // ── Grid ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // ── Chip ──
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.inkLight,
  },
  chipTextSelected: {
    color: colors.white,
    fontFamily: fontFamily.bold,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
