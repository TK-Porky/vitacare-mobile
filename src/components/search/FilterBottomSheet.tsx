import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
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

const SERVICE_IDS = [
  'Dentition',
  'Analyse Médicale',
  'Dermatologie',
  'Piendontologie',
  'Pédiatrie',
  'Génicologie',
] as const;

const LANGUAGE_IDS = ['Français', 'Anglais', 'Pongo', 'Bami', 'Eton', 'Arabe'] as const;

export type FilterBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  initialFilters?: FilterState;
  onApply?: (filters: FilterState) => void;
  onClose?: () => void;
};

const getServiceKey = (id: string) => {
  const map: Record<string, string> = {
    'Dentition': 'servicesDentition',
    'Analyse Médicale': 'servicesAnalyseMedicale',
    'Dermatologie': 'servicesDermatologie',
    'Piendontologie': 'servicesPiendontologie',
    'Pédiatrie': 'servicesPediatrie',
    'Génicologie': 'servicesGenicologie',
  };
  return map[id] || id;
};

const getLanguageKey = (id: string) => {
  const map: Record<string, string> = {
    'Français': 'languagesFrench',
    'Anglais': 'languagesEnglish',
    'Pongo': 'languagesPongo',
    'Bami': 'languagesBami',
    'Eton': 'languagesEton',
    'Arabe': 'languagesArabic',
  };
  return map[id] || id;
};

export const FilterBottomSheet = forwardRef<FilterBottomSheetRef, Props>(
  ({ initialFilters = DEFAULT_FILTERS, onApply, onClose }, ref) => {
    const { t } = useTranslation();
    const sheetRef = useRef<AppBottomSheetRef>(null);

    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [servicesOpen, setServicesOpen] = useState(true);
    const [languagesOpen, setLanguagesOpen] = useState(true);
    const [priceOpen, setPriceOpen] = useState(true);

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

    const handleBack = () => {
      sheetRef.current?.close();
    };

    return (
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={['55%', '92%']}
        footer={
          <View style={styles.footer}>
            <PrimaryButton
              label={t('search.back')}
              variant="outline"
              size="md"
              onPress={handleBack}
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
        <Text style={styles.sheetTitle}>{t('search.filterTitle')}</Text>

        <View style={styles.section}>
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

        <View style={styles.divider} />

        <View style={styles.section}>
          <FilterSectionHeader
            title={t('search.services')}
            subtitle={t('search.servicesSubtitle')}
            isOpen={servicesOpen}
            onToggle={() => setServicesOpen((v) => !v)}
          />
          {servicesOpen && (
            <View style={styles.chipsWrap}>
              {SERVICE_IDS.map((s) => (
                <FilterChip
                  key={s}
                  label={t(`search.${getServiceKey(s)}`)}
                  isSelected={filters.services.includes(s)}
                  onPress={() => toggleItem('services', s)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <FilterSectionHeader
            title={t('search.languages')}
            subtitle={t('search.languagesSubtitle')}
            isOpen={languagesOpen}
            onToggle={() => setLanguagesOpen((v) => !v)}
          />
          {languagesOpen && (
            <View style={styles.chipsWrap}>
              {LANGUAGE_IDS.map((l) => (
                <FilterChip
                  key={l}
                  label={t(`search.${getLanguageKey(l)}`)}
                  isSelected={filters.languages.includes(l)}
                  onPress={() => toggleItem('languages', l)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <FilterSectionHeader
            title={t('search.priceFilter')}
            subtitle={t('search.priceFilterSubtitle')}
            isOpen={priceOpen}
            onToggle={() => setPriceOpen((v) => !v)}
          />
          {priceOpen && (
            <View style={styles.priceNote}>
              <Text style={styles.priceNoteText}>
                {t('search.priceComingSoon')}
              </Text>
            </View>
          )}
        </View>
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
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    color: colors.ink,
    marginBottom: 8,
    marginTop: 4,
  },
  section: {
    gap: 12,
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slider: {
    marginTop: 4,
  },
  priceNote: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  priceNoteText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    fontStyle: 'italic',
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
