import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  documentDirectory,
  readDirectoryAsync,
  getInfoAsync,
  deleteAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors, fontFamily, fontSize } from '../../../src/themes';
import { TopBar } from '../../../src/components';

// ─── Types ────────────────────────────────────────────────────────────────────

type DownloadedFile = {
  name: string;
  uri: string;
  size: number;
  modifiedAt: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileCard({
  file,
  onShare,
  onDelete,
}: {
  file: DownloadedFile;
  onShare: () => void;
  onDelete: () => void;
}) {
  const displayName = file.name.replace(/\.pdf$/i, '').replace(/-/g, ' ');

  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons name="document-text" size={26} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.fileName} numberOfLines={2}>{displayName}</Text>
        <Text style={styles.fileMeta}>
          {formatSize(file.size)} · {formatDate(file.modifiedAt)}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={onShare} style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={20} color={colors.ink} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="cloud-download-outline" size={56} color={colors.border} />
      <Text style={styles.emptyTitle}>Aucun téléchargement</Text>
      <Text style={styles.emptySubtitle}>
        Les tickets de rendez-vous que vous téléchargez apparaîtront ici.
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DownloadsScreen() {
  const [files, setFiles] = useState<DownloadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const dir = documentDirectory;
      if (!dir) return;
      const entries = await readDirectoryAsync(dir);
      const pdfs = entries.filter((name) => name.toLowerCase().endsWith('.pdf'));

      const detailed = await Promise.all(
        pdfs.map(async (name) => {
          const uri  = `${dir}${name}`;
          const info = await getInfoAsync(uri);
          return {
            name,
            uri,
            size: (info as any).size ?? 0,
            modifiedAt: (info as any).modificationTime
              ? (info as any).modificationTime * 1000
              : Date.now(),
          };
        }),
      );

      // Sort newest first
      setFiles(detailed.sort((a, b) => b.modifiedAt - a.modifiedAt));
    } catch {
      // Directory might be empty or inaccessible — silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleShare = async (file: DownloadedFile) => {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: file.name,
          UTI: 'com.adobe.pdf',
        });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de partager ce fichier.');
    }
  };

  const handleDelete = (file: DownloadedFile) => {
    Alert.alert(
      'Supprimer le fichier',
      `Voulez-vous supprimer "${file.name.replace('.pdf', '')}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAsync(file.uri);
              setFiles((prev) => prev.filter((f) => f.uri !== file.uri));
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer ce fichier.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <TopBar title="Mes Téléchargements" />

      <FlatList
        data={files}
        keyExtractor={(item) => item.uri}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={loadFiles}
        refreshing={isLoading}
        ListHeaderComponent={
          files.length > 0 ? (
            <Text style={styles.countLabel}>
              {files.length} fichier{files.length > 1 ? 's' : ''}
            </Text>
          ) : null
        }
        ListEmptyComponent={isLoading ? null : <EmptyState />}
        renderItem={({ item }) => (
          <FileCard
            file={item}
            onShare={() => handleShare(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  list: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  countLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  fileName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  fileMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkMuted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 20,
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
    lineHeight: 20,
  },
});
