import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

const SERVICES = [
  'Dentition',
  'Analyse Médicale',
  'Dermatologie',
  'Piendontologie',
  'Pédiatrie',
  'Génicologie',
];

const LANGUAGES = ['Français', 'Anglais', 'Pongo', 'Bami', 'Eton', 'Arabe'];

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
              label="Retour"
              variant="outline"
              size="md"
              onPress={handleBack}
              style={styles.footerBtn}
            />
            <PrimaryButton
              label="Afficher les résultats"
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
        <Text style={styles.sheetTitle}>Filtres</Text>

        <View style={styles.section}>
          <FilterSectionHeader
            title="Périmètre"
            subtitle={`Affichés les résultats dans un périmètre de ${filters.perimeterKm}Km`}
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
            title="Services"
            subtitle="Sélectionner les types de services recherchés"
            isOpen={servicesOpen}
            onToggle={() => setServicesOpen((v) => !v)}
          />
          {servicesOpen && (
            <View style={styles.chipsWrap}>
              {SERVICES.map((s) => (
                <FilterChip
                  key={s}
                  label={s}
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
            title="Langages"
            subtitle="Langue parlée par les professionnels de santé"
            isOpen={languagesOpen}
            onToggle={() => setLanguagesOpen((v) => !v)}
          />
          {languagesOpen && (
            <View style={styles.chipsWrap}>
              {LANGUAGES.map((l) => (
                <FilterChip
                  key={l}
                  label={l}
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
            title="Prix"
            subtitle="L'intervalle des prix de la consultation"
            isOpen={priceOpen}
            onToggle={() => setPriceOpen((v) => !v)}
          />
          {priceOpen && (
            <View style={styles.priceNote}>
              <Text style={styles.priceNoteText}>
                Filtre de prix bientôt disponible
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
