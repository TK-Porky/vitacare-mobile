import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../themes';
import { PrimaryButton } from '../buttons';

export type Provider = {
  id: string;
  name: string;
  avatarUri?: string;
  coverUri?: string;
  distanceKm: number;
  priceXCFA: number;
  address?: string;
};

type Props = {
  provider: Provider;
  onReserve?: () => void;
  style?: ViewStyle;
};

export const MapProviderCard = ({ provider, onReserve, style }: Props) => {
  return (
    <View style={[styles.card, style]}>
      {/* Header: avatar + name + distance + price */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          {provider.avatarUri ? (
            <Image source={{ uri: provider.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {provider.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{provider.distanceKm} Km</Text>
            <View style={styles.dot} />
            <Text style={styles.price}>
              {provider.priceXCFA.toLocaleString()} XCFA
            </Text>
          </View>
        </View>
        <PrimaryButton
          label="Réserver"
          icon={<Ionicons name="calendar-outline" size={18} color={colors.white} />}
          onPress={onReserve}
          style={styles.reserveBtn}
        />
      </View>

      {/* Cover image */}
      {provider.coverUri ? (
        <Image
          source={{ uri: provider.coverUri }}
          style={styles.cover}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]} />
      )}

      {/* Address */}
      {provider.address && (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={colors.ink} />
          <Text style={styles.address} numberOfLines={1}>
            {provider.address}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: colors.inkFaint,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.inkMuted,
  },
  price: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  reserveBtn: {
    minWidth: 100,
  },
  cover: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  coverPlaceholder: {
    backgroundColor: colors.inkFaint,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
    flex: 1,
  },
});
