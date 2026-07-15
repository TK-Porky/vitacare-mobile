import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppBottomSheet, AppBottomSheetRef } from '../generics';
import { FilterSectionHeader } from './filter/FilterSectionHeader';
import { FilterChip } from './filter/FilterChip';
import { FilterRangeSlider } from './filter/FilterRangeSlider';
import { PrimaryButton } from '../buttons';
import { colors, fontFamily, fontSize } from '../../themes';

export type FilterState = {
  perimeterKm: number;
  services: string[];
  languages: string[];
};

const DEFAULT_FILTERS: FilterState = {
  perimeterKm: 15,
  services: [],
  languages: [],
};

const SERVICE_ITEMS = [
  { value: 'Dentition', labelKey: 'search.servicesDentition' },
  { value: 'Analyse Médicale', labelKey: 'search.servicesAnalyseMedicale' },
  { value: 'Dermatologie', labelKey: 'search.servicesDermatologie' },
  { value: 'Parodontologie', labelKey: 'search.servicesParodontologie' },
  { value: 'Pédiatrie', labelKey: 'search.servicesPediatrie' },
  { value: 'Gynécologie', labelKey: 'search.servicesGynecologie' },
] as const;

const LANGUAGE_ITEMS = [
  { value: 'Français', labelKey: 'search.languagesFrench' },
  { value: 'Anglais', labelKey: 'search.languagesEnglish' },
  { value: 'Pongo', labelKey: 'search.languagesPongo' },
  { value: 'Bami', labelKey: 'search.languagesBami' },
  { value: 'Eton', labelKey: 'search.languagesEton' },
  { value: 'Arabe', labelKey: 'search.languagesArabic' },
] as const;

export type FilterBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  initialFilters?: FilterState;
  onApply?: (filters: FilterState) => void;
  onClose?: () => void;
};

export const FilterBottomSheet = forwardRef<FilterBottomSheetRef, Props>(
  ({ initialFilters = DEFAULT_FILTERS, onApply, onClose }, ref) => {
    const { t } = useTranslation();
    const sheetRef = useRef<AppBottomSheetRef>(null);

    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [servicesOpen, setServicesOpen] = useState(true);
    const [languagesOpen, setLanguagesOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    const toggleItem = (
      key: 'services' | 'languages',
      value: string
    ) => {
      setFilters((prev) => {
        const list = prev[key];
        return {
          ...prev,
          [key]: list.includes(value)
            ? list.filter((v) => v !== value)
            : [...list, value],
        };
      });
    };

    const handleApply = () => {
      onApply?.(filters);
      sheetRef.current?.close();
    };

    const handleReset = () => {
      setFilters(DEFAULT_FILTERS);
    };

    return (
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={['55%', '92%']}
        footer={
          <View style={styles.footer}>
            <PrimaryButton
              label="Réinitialiser"
              variant="outline"
              size="md"
              onPress={handleReset}
              style={styles.footerBtn}
            />
            <PrimaryButton
              label={t('search.showResults')}
              variant="solid"
              size="md"
              onPress={handleApply}
              style={styles.footerBtnPrimary}
            />
          </View>
        }
        onClose={onClose}
        scrollable
        containerStyle={styles.sheet}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.sheetTitle}>{t('search.filterTitle')}</Text>
          <TouchableOpacity
            onPress={() => sheetRef.current?.close()}
            hitSlop={8}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {/* ── Perimeter ── */}
        <View style={styles.sectionCard}>
          <FilterSectionHeader
            title={t('search.perimeter')}
            subtitle={t('search.perimeterSubtitle', { km: filters.perimeterKm })}
          />
          <FilterRangeSlider
            value={filters.perimeterKm}
            min={1}
            max={50}
            step={1}
            onChange={(v) => setFilters((p) => ({ ...p, perimeterKm: v }))}
            style={styles.slider}
          />
        </View>

        {/* ── Services ── */}
        <View style={styles.sectionCard}>
          <FilterSectionHeader
            title={t('search.services')}
            subtitle={t('search.servicesSubtitle')}
            isOpen={servicesOpen}
            onToggle={() => setServicesOpen((v) => !v)}
          />
          {servicesOpen && (
            <View style={styles.chipsWrap}>
              {SERVICE_ITEMS.map((s) => (
                <FilterChip
                  key={s.value}
                  label={t(s.labelKey)}
                  isSelected={filters.services.includes(s.value)}
                  onPress={() => toggleItem('services', s.value)}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Languages ── */}
        <View style={styles.sectionCard}>
          <FilterSectionHeader
            title={t('search.languagesTitle')}
            subtitle={t('search.languagesSubtitle')}
            isOpen={languagesOpen}
            onToggle={() => setLanguagesOpen((v) => !v)}
          />
          {languagesOpen && (
            <View style={styles.chipsWrap}>
              {LANGUAGE_ITEMS.map((l) => (
                <FilterChip
                  key={l.value}
                  label={t(l.labelKey)}
                  isSelected={filters.languages.includes(l.value)}
                  onPress={() => toggleItem('languages', l.value)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 16 }} />
      </AppBottomSheet>
    );
  }
);

FilterBottomSheet.displayName = 'FilterBottomSheet';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 4,
  },
  sheetTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  slider: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  footerBtn: {
    flex: 1,
  },
  footerBtnPrimary: {
    flex: 2,
  },
});
