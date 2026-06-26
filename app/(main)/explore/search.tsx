import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../../src/themes';

// ─── Mock data ────────────────────────────────────────────────────────────────

type Provider = {
  id: string;
  name: string;
  specialty: string;
  avatarUri: string;
};

const ALL_PROVIDERS: Provider[] = [
  { id: '1', name: 'Dr. Aminou Ousman',   specialty: 'Généraliste',  avatarUri: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: '2', name: 'Dr. Mariama Siantou', specialty: 'Pédiatre',     avatarUri: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: '3', name: 'Dr. Christian Mba',   specialty: 'Ophtalmologue', avatarUri: 'https://randomuser.me/api/portraits/men/15.jpg' },
  { id: '4', name: 'Dr. Aïssatou Diallo', specialty: 'Cardiologue',   avatarUri: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: '5', name: 'Dr. Sylvain Nkoulou', specialty: 'Dermatologue',  avatarUri: 'https://randomuser.me/api/portraits/men/52.jpg' },
  { id: '6', name: 'Dr. Fatou Camara',    specialty: 'Gynécologue',   avatarUri: 'https://randomuser.me/api/portraits/women/23.jpg' },
  { id: '7', name: 'Dr. Ibrahima Baldé',  specialty: 'Chirurgien',    avatarUri: 'https://randomuser.me/api/portraits/men/71.jpg' },
];

const ALL_SUGGESTIONS = [
  'Maux de gorge',
  "Maux d'estomac",
  'Maux de tête',
  'Fièvre',
  'Douleur',
  'Toux',
  'Grippe',
  'Allergie',
  'Urgences',
  'Pédiatrie',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SuggestionChip = ({ label, query, onPress }: { label: string; query: string; onPress: () => void }) => {
  const lower = label.toLowerCase();
  const q = query.toLowerCase();
  const idx = q.length > 0 ? lower.indexOf(q) : -1;

  return (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.7}>
      {idx === -1 || q.length === 0 ? (
        <Text style={styles.chipLabel}>{label}</Text>
      ) : (
        <Text style={styles.chipLabel}>
          {label.slice(0, idx)}
          <Text style={styles.chipLabelBold}>{label.slice(idx, idx + query.length)}</Text>
          {label.slice(idx + query.length)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const ProviderRow = ({ item }: { item: Provider }) => (
  <TouchableOpacity style={styles.providerRow} activeOpacity={0.75}>
    <Image source={{ uri: item.avatarUri }} style={styles.avatar} />
    <View style={styles.providerInfo}>
      <Text style={styles.providerName}>{item.name}</Text>
      <Text style={styles.providerSpecialty}>{item.specialty}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
  </TouchableOpacity>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExploreSearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    if (query.trim().length === 0) return ALL_SUGGESTIONS.slice(0, 6);
    return ALL_SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const results = useMemo(() => {
    if (query.trim().length === 0) return ALL_PROVIDERS;
    const q = query.toLowerCase();
    return ALL_PROVIDERS.filter(
      p => p.name.toLowerCase().includes(q) || p.specialty.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Search header ── */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un professionnel..."
            placeholderTextColor={colors.inkMuted}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ProviderRow item={item} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* ── Suggestions ── */}
            {suggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Termes suggérés</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  {suggestions.map(s => (
                    <SuggestionChip
                      key={s}
                      label={s}
                      query={query}
                      onPress={() => setQuery(s)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Results label ── */}
            <Text style={styles.sectionLabel}>Meilleures correspondances</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={colors.inkFaint} />
            <Text style={styles.emptyText}>Aucun résultat pour « {query} »</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // ── Header ──
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backBtn: {
    padding: 4,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    padding: 0,
  },

  // ── List ──
  listContent: {
    paddingBottom: 32,
  },

  // ── Sections ──
  section: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },

  // ── Suggestion chips ──
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(17, 199, 147, 0.1)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(17, 199, 147, 0.3)',
  },
  chipLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primaryDark,
  },
  chipLabelBold: {
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
  },

  // ── Provider rows ──
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  providerInfo: {
    flex: 1,
    gap: 2,
  },
  providerName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  providerSpecialty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },

  // ── Empty ──
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.inkMuted,
  },
});
