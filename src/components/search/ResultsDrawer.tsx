import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../themes';
import { AppBottomSheet, AppBottomSheetRef } from '../generics';
import { ClinicProvider } from '../../types';

export type ResultsDrawerRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  providers: ClinicProvider[];
  onProviderPress?: (id: string) => void;
};

export const ResultsDrawer = forwardRef<ResultsDrawerRef, Props>(
  ({ providers, onProviderPress }, ref) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    const sorted = useMemo(
      () =>
        [...providers].sort((a, b) => {
          const distA = a.coordinates?.latitude ?? 0;
          const distB = b.coordinates?.latitude ?? 0;
          return distA - distB;
        }),
      [providers],
    );

    const renderItem = ({ item }: { item: ClinicProvider }) => (
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.7}
        onPress={() => onProviderPress?.(item.id)}
      >
        <View style={styles.avatarWrap}>
          {item.avatarUri ? (
            <Image source={{ uri: item.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={22} color={colors.white} />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.doctorName}
          </Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {item.specialty}
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color={colors.inkLight} />
            {' '}{item.clinicName}
          </Text>
        </View>
        <View style={styles.right}>
          {item.priceXCFA != null && (
            <Text style={styles.price}>{item.priceXCFA.toLocaleString()} FCFA</Text>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />
        </View>
      </TouchableOpacity>
    );

    return (
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={['35%', '75%']}
        scrollable
        containerStyle={styles.sheet}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {providers.length} résultat{providers.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={() => sheetRef.current?.close()}
            hitSlop={8}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {/* ── List ── */}
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </AppBottomSheet>
    );
  },
);

ResultsDrawer.displayName = 'ResultsDrawer';

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  specialty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  location: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primaryDark,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
