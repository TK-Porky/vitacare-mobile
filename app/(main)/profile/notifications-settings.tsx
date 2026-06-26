import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontFamily, fontSize } from '../../../src/themes';
import { TopBar } from '../../../src/components';

type ToggleItemProps = {
  label: string;
  description: string;
  isEnabled: boolean;
  onToggle: (value: boolean) => void;
  isLoading?: boolean;
};

function ToggleItem({ label, description, isEnabled, onToggle, isLoading }: ToggleItemProps) {
  return (
    <View style={styles.toggleItem}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Switch
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={isEnabled ? colors.primary : colors.white}
          ios_backgroundColor={colors.border}
          onValueChange={onToggle}
          value={isEnabled}
        />
      )}
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const [reminders, setReminders]       = useState(true);
  const [appointments, setAppointments] = useState(true);
  const [healthTips, setHealthTips]     = useState(true);
  const [isSaving, setIsSaving]         = useState(false);

  // Simulate saving to server
  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    return async (value: boolean) => {
      setter(value);
      setIsSaving(true);
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSaving(false);
    };
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <TopBar title="Notifications" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.card}>
            <ToggleItem
              label="Rappels de médicaments"
              description="Recevoir une notification pour chaque prise prévue."
              isEnabled={reminders}
              onToggle={handleToggle(setReminders)}
            />
            <ToggleItem
              label="Alertes de rendez-vous"
              description="Rappels avant vos rendez-vous médicaux."
              isEnabled={appointments}
              onToggle={handleToggle(setAppointments)}
            />
            <ToggleItem
              label="Conseils santé"
              description="Conseils et actualités santé de VitaCare."
              isEnabled={healthTips}
              onToggle={handleToggle(setHealthTips)}
            />
          </View>
        </View>

        <View>
          <Text style={styles.infoText}>
            Note : Vous pouvez également gérer ces permissions dans les réglages système de votre téléphone.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    marginBottom: 16,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  toggleText: {
    flex: 1,
    gap: 4,
  },
  toggleLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  toggleDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  infoBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
    lineHeight: 20,
  },
});
