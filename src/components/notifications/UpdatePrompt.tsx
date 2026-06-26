import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import type { UpdateCheckResult } from '@vitacare/shared-types';
import { updateService } from '../../services/update.service';

interface Props {
  result: UpdateCheckResult;
  onDismiss: () => void;
}

/**
 * UpdateBanner / UpdateModal
 *
 * - Mandatory update  → full-screen blocking Modal (no dismiss button)
 * - Optional update   → dismissible bottom banner
 */
export function UpdatePrompt({ result, onDismiss }: Props) {
  if (!result.hasUpdate || !result.latestVersion) return null;

  const { latestVersion, isMandatory } = result;

  const handleUpdate = () => {
    updateService.openStoreOrDownload(latestVersion);
  };

  if (isMandatory) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Mise à jour requise</Text>
            </View>
            <Text style={styles.title}>VitaCare {latestVersion.version}</Text>
            <Text style={styles.body}>
              Cette mise à jour est obligatoire pour continuer à utiliser l'application.
            </Text>
            {latestVersion.releaseNotes ? (
              <Text style={styles.notes} numberOfLines={4}>
                {latestVersion.releaseNotes}
              </Text>
            ) : null}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdate}>
              <Text style={styles.primaryBtnText}>Mettre à jour</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Optional — dismissible banner
  return (
    <View style={styles.banner}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>Mise à jour disponible</Text>
        <Text style={styles.bannerBody}>
          VitaCare {latestVersion.version} est disponible.
        </Text>
      </View>
      <View style={styles.bannerActions}>
        <TouchableOpacity style={styles.bannerBtn} onPress={handleUpdate}>
          <Text style={styles.bannerBtnText}>Installer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bannerDismiss} onPress={onDismiss}>
          <Text style={styles.bannerDismissText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const TEAL = '#0D9488';

const styles = StyleSheet.create({
  /* Mandatory modal */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { color: '#92400E', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center' },
  body: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  notes: {
    fontSize: 13,
    color: '#374151',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: TEAL,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  /* Optional banner */
  banner: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  bannerBody: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  bannerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerBtn: {
    backgroundColor: TEAL,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bannerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  bannerDismiss: { padding: 8 },
  bannerDismissText: { color: '#9CA3AF', fontSize: 16 },
});
