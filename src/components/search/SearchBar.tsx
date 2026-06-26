import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../buttons';
import { colors, fontFamily, fontSize } from '../../themes';

type Props = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  style?: ViewStyle;
};

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Rechercher votre position...',
  onFilterPress,
  style,
}: Props) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="search-outline"
        size={18}
        color={colors.inkMuted}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        returnKeyType="search"
      />
      <PrimaryButton
        onPress={onFilterPress}
        icon={<Ionicons name="options-outline" size={18} color={colors.white} />}
        isRound={true}
        size="sm"
        style={styles.filterButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingLeft: 14,
    paddingHorizontal: 4,
    height: 44,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    padding: 0,
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
