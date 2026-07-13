import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";
import { HOURS_24, MINUTES } from "./types";

type TimePickerInlineProps = {
  value: string;
  onChange: (t: string) => void;
  onHourSelect?: (hour: string) => void;
  onMinuteSelect?: (minute: string) => void;
};

const haptic = () => {
  if (Platform.OS === "ios") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

const TimePickerInlineComponent = ({
  value,
  onChange,
  onHourSelect,
  onMinuteSelect,
}: TimePickerInlineProps) => {
  const { t } = useTranslation();
  const initialState = useMemo(() => {
    if (!value || !value.includes(":")) return { hour: "12", minute: "30" };
    const [h, m] = value.split(":");
    return { hour: h || "12", minute: m || "30" };
  }, []);

  const [hour, setHour] = useState(initialState.hour);
  const [minute, setMinute] = useState(initialState.minute);

  const hourIndex = Math.min(Math.max(Number(hour), 0), 23);
  const minuteIndex = Math.max(MINUTES.indexOf(minute), 0);

  // ── Heures ──────────────────────────────────────────────
  const navigateHour = useCallback(
    (direction: "up" | "down") => {
      haptic();
      let newIndex = direction === "up" ? hourIndex - 1 : hourIndex + 1;
      if (newIndex < 0) newIndex = 23;
      if (newIndex > 23) newIndex = 0;
      const newHour = HOURS_24[newIndex];
      setHour(newHour);
      onChange(`${newHour}:${minute}`);
      onHourSelect?.(newHour);
    },
    [hourIndex, minute, onChange, onHourSelect],
  );

  // ── Minutes ─────────────────────────────────────────────
  const navigateMinute = useCallback(
    (direction: "up" | "down") => {
      haptic();
      let newIndex = direction === "up" ? minuteIndex - 1 : minuteIndex + 1;
      if (newIndex < 0) newIndex = MINUTES.length - 1;
      if (newIndex >= MINUTES.length) newIndex = 0;
      const newMinute = MINUTES[newIndex];
      setMinute(newMinute);
      onChange(`${hour}:${newMinute}`);
      onMinuteSelect?.(newMinute);
    },
    [minuteIndex, hour, onChange, onMinuteSelect],
  );

  // Valeurs prev / current / next pour l'affichage 3 slots
  const hourPrev = HOURS_24[hourIndex === 0 ? 23 : hourIndex - 1];
  const hourNext = HOURS_24[hourIndex === 23 ? 0 : hourIndex + 1];

  const minutePrev =
    MINUTES[minuteIndex === 0 ? MINUTES.length - 1 : minuteIndex - 1];
  const minuteNext =
    MINUTES[minuteIndex === MINUTES.length - 1 ? 0 : minuteIndex + 1];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("reminders.addForm.time")}</Text>

      <View style={styles.row}>
        {/* ── Colonne Heure ── */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>{t("reminders.addForm.time")}</Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateHour("up")}
            activeOpacity={0.7}
            accessibilityLabel={t("accessibility.startSearch")}
          >
            <Ionicons name="chevron-up" size={22} color={colors.black} />
          </TouchableOpacity>

          {/* Slot précédent */}
          <TouchableOpacity
            style={styles.cellGhost}
            onPress={() => navigateHour("up")}
            activeOpacity={0.5}
          >
            <Text style={styles.cellTextGhost}>{hourPrev}</Text>
          </TouchableOpacity>

          {/* Slot sélectionné */}
          <View style={styles.cellSelected}>
            <Text style={styles.cellTextSelected}>{hour}</Text>
          </View>

          {/* Slot suivant */}
          <TouchableOpacity
            style={styles.cellGhost}
            onPress={() => navigateHour("down")}
            activeOpacity={0.5}
          >
            <Text style={styles.cellTextGhost}>{hourNext}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateHour("down")}
            activeOpacity={0.7}
            accessibilityLabel={t("accessibility.startSearch")}
          >
            <Ionicons name="chevron-down" size={22} color={colors.black} />
          </TouchableOpacity>
        </View>

        {/* ── Séparateur ── */}
        <Text style={styles.separator}>:</Text>

        {/* ── Colonne Minute ── */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>{t("reminders.addForm.time")}</Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMinute("up")}
            activeOpacity={0.7}
            accessibilityLabel={t("accessibility.startSearch")}
          >
            <Ionicons name="chevron-up" size={22} color={colors.black} />
          </TouchableOpacity>

          {/* Slot précédent */}
          <TouchableOpacity
            style={styles.cellGhost}
            onPress={() => navigateMinute("up")}
            activeOpacity={0.5}
          >
            <Text style={styles.cellTextGhost}>{minutePrev}</Text>
          </TouchableOpacity>

          {/* Slot sélectionné */}
          <View style={styles.cellSelected}>
            <Text style={styles.cellTextSelected}>{minute}</Text>
          </View>

          {/* Slot suivant */}
          <TouchableOpacity
            style={styles.cellGhost}
            onPress={() => navigateMinute("down")}
            activeOpacity={0.5}
          >
            <Text style={styles.cellTextGhost}>{minuteNext}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMinute("down")}
            activeOpacity={0.7}
            accessibilityLabel={t("accessibility.startSearch")}
          >
            <Ionicons name="chevron-down" size={22} color={colors.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Résumé ── */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>{t("reminders.addForm.time")}</Text>
        <Text style={styles.footerValue}>{`${hour}:${minute}`}</Text>
      </View>
    </View>
  );
};

export const TimePickerInline = React.memo(TimePickerInlineComponent);
TimePickerInline.displayName = "TimePickerInline";

// ── Styles ────────────────────────────────────────────────────────────────────

const CELL_H = 44;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.ink,
    textAlign: "center",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  columnLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.inkLight,
    marginBottom: 4,
  },
  navButton: {
    width: 48,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  // Slot sélectionné (central)
  cellSelected: {
    width: "80%",
    height: CELL_H,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cellTextSelected: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.white,
  },
  // Slots fantômes (prev / next) — tappables
  cellGhost: {
    width: "80%",
    height: CELL_H,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cellTextGhost: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
  },
  separator: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.ink,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  footerValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.primary,
  },
});
