import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../themes';

type TabType = 'upcoming' | 'past';

interface TabsSectionProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabsSection({ activeTab, onTabChange }: TabsSectionProps) {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
        onPress={() => onTabChange('upcoming')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="alarm-outline"
          size={16}
          color={activeTab === 'upcoming' ? colors.primary : colors.inkLight}
        />
        <Text style={[styles.tabLabel, activeTab === 'upcoming' && styles.tabLabelActive]}>
          A Venir
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'past' && styles.tabActive]}
        onPress={() => onTabChange('past')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="calendar-outline"
          size={16}
          color={activeTab === 'past' ? colors.primary : colors.inkLight}
        />
        <Text style={[styles.tabLabel, activeTab === 'past' && styles.tabLabelActive]}>
          Passés
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    shadowColor: colors.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.white,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.inkLight,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
