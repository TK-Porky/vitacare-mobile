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
import { useTranslation } from 'react-i18next';
import { colors, fontFamily, fontSize } from '../../../src/themes';
import { TopBar } from '../../../src/components';

type DownloadedFile = {
  name: string;
  uri: string;
  size: number;
  modifiedAt: number;
};

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
  const { t } = useTranslation();

  return (
    <View style={styles.empty}>
      <Ionicons name="cloud-download-outline" size={56} color={colors.border} />
      <Text style={styles.emptyTitle}>{t('profile.downloadsScreen.emptyTitle')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('profile.downloadsScreen.emptySubtitle')}
      </Text>
    </View>
  );
}

export default function DownloadsScreen() {
  const { t } = useTranslation();
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

      setFiles(detailed.sort((a, b) => b.modifiedAt - a.modifiedAt));
    } catch {
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
      Alert.alert(t('common.error'), t('profile.downloadsScreen.shareError'));
    }
  };

  const handleDelete = (file: DownloadedFile) => {
    Alert.alert(
      t('profile.downloadsScreen.deleteTitle'),
      t('profile.downloadsScreen.deleteConfirm', { name: file.name.replace('.pdf', '') }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAsync(file.uri);
              setFiles((prev) => prev.filter((f) => f.uri !== file.uri));
            } catch {
              Alert.alert(t('common.error'), t('profile.downloadsScreen.deleteError'));
            }
          },
        },
      ],
    );
  };

  const keyExtractor = useCallback((item: DownloadedFile) => item.uri, []);

  const renderItem = useCallback(
    ({ item }: { item: DownloadedFile }) => (
      <FileCard
        file={item}
        onShare={() => handleShare(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [t],
  );

  const renderHeader = useCallback(() => {
    if (files.length === 0) return null;
    const countKey = files.length === 1 ? 'profile.downloadsScreen.count' : 'profile.downloadsScreen.count_other';
    return (
      <Text style={styles.countLabel}>
        {t(countKey, { count: files.length })}
      </Text>
    );
  }, [files.length, t]);

  const renderSeparator = useCallback(
    () => <View style={{ height: 10 }} />,
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <TopBar title={t('profile.downloadsScreen.title')} />

      <FlatList
        data={files}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={loadFiles}
        refreshing={isLoading}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={isLoading ? null : <EmptyState />}
        ItemSeparatorComponent={renderSeparator}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

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
