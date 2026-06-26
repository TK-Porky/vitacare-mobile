import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../themes';
import { StepLabel } from './StepLabel';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  selected: Date | null;
  onSelect: (d: Date) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// Horizontal padding applied to the step content in BookingBottomSheet (16px each side)
const STEP_H_PADDING = 32;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Splits a flat day array into rows of 7, padding the last row with nulls. */
function toWeeks(cells: (number | null)[]): (number | null)[][] {
  const padded = [...cells];
  while (padded.length % 7 !== 0) padded.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

// ─── Main component ───────────────────────────────────────────────────────────

export const StepDate = ({ selected, onSelect }: Props) => {
  const { width: screenWidth } = useWindowDimensions();

  // Cell size adapts to screen width: fills exactly 7 columns with no gap
  const cellSize = Math.floor((screenWidth - STEP_H_PADDING) / 7);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const weeks = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    return toWeeks(cells);
  }, [viewYear, viewMonth]);

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isDayPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isDaySelected = (day: number) =>
    selected !== null &&
    selected.getDate() === day &&
    selected.getMonth() === viewMonth &&
    selected.getFullYear() === viewYear;

  const isDayToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  return (
    <View>
      <StepLabel number={1} label="Choisissez la date" />

      {/* Month navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={prevMonth}
          style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
          disabled={!canGoPrev}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={canGoPrev ? colors.ink : colors.inkFaint}
          />
        </TouchableOpacity>

        <Text style={styles.monthLabel}>
          {MONTH_LABELS[viewMonth]} {viewYear}
        </Text>

        <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.row}>
        {DAY_LABELS.map(label => (
          <View key={label} style={[styles.headerCell, { width: cellSize }]}>
            <Text style={styles.dayHeader}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid — one View per week row */}
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.row}>
            {week.map((day, di) => {
              if (!day) {
                return (
                  <View
                    key={`empty-${wi}-${di}`}
                    style={{ width: cellSize, height: cellSize }}
                  />
                );
              }

              const past = isDayPast(day);
              const sel = isDaySelected(day);
              const isToday = isDayToday(day);

              return (
                <TouchableOpacity
                  key={day}
                  activeOpacity={0.75}
                  disabled={past}
                  onPress={() => onSelect(new Date(viewYear, viewMonth, day))}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize, borderRadius: cellSize / 2 },
                    isToday && !sel && styles.cellToday,
                    sel && styles.cellSelected,
                    past && styles.cellPast,
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      past && styles.cellTextPast,
                      isToday && !sel && styles.cellTextToday,
                      sel && styles.cellTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  monthLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.ink,
    letterSpacing: -0.2,
  },

  // ── Day labels row ──
  row: {
    flexDirection: 'row',
  },
  headerCell: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayHeader: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // ── Grid ──
  grid: {
    gap: 4,
    marginTop: 4,
  },

  // ── Day cell ──
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: colors.primary,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  cellPast: {
    opacity: 0.3,
  },

  // ── Cell text ──
  cellText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  cellTextPast: {
    color: colors.inkMuted,
  },
  cellTextToday: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
  cellTextSelected: {
    color: colors.white,
    fontFamily: fontFamily.bold,
  },
});