import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppBottomSheet, AppBottomSheetRef } from "../generics";
import { PrimaryButton } from "../buttons";
import { colors, fontFamily, fontSize } from "../../themes";

export type ReminderData = {
  drugName: string;
  form: string;
  dosageValue: string;
  dosageUnit: string;
  frequencyUnit: string;
  frequencyCount: string;
  intervalDays: string;
  time: string; // "HH:MM"
};

const DEFAULT_REMINDER: ReminderData = {
  drugName: "",
  form: "Gelule",
  dosageValue: "",
  dosageUnit: "mg",
  frequencyUnit: "Semaine",
  frequencyCount: "1",
  intervalDays: "",
  time: "12:30",
};

export type AddReminderBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  onAdd?: (data: ReminderData) => void;
  onClose?: () => void;
};

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const FORMS = [
  "Gelule",
  "Comprimé",
  "Sirop",
  "Injectable",
  "Pommade",
  "Sachet",
];
const DOSAGE_UNITS = ["mg", "ml", "g", "µg", "UI"];
const FREQUENCY_UNITS = ["Semaine", "Jour", "Mois"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const InlineDropdown = ({
  label,
  value,
  options,
  onSelect,
  style,
}: {
  label?: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  style?: object;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={[{ position: "relative" }, style]}>
      {label && <Text style={dropStyles.fieldLabel}>{label}</Text>}
      <TouchableOpacity
        style={dropStyles.trigger}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <Text style={dropStyles.triggerText}>{value}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.inkMuted}
        />
      </TouchableOpacity>
      {open && (
        <View style={dropStyles.menu}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                dropStyles.menuItem,
                opt === value && dropStyles.menuItemSelected,
              ]}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  dropStyles.menuItemText,
                  opt === value && dropStyles.menuItemTextSelected,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const dropStyles = StyleSheet.create({
  fieldLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  triggerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  menu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 999,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  menuItemSelected: {
    backgroundColor: colors.inkFaint ?? "#E8F5E9",
  },
  menuItemText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  menuItemTextSelected: {
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
});

const FieldInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  style,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  style?: object;
}) => (
  <View style={style}>
    {label && <Text style={fieldStyles.label}>{label}</Text>}
    <TextInput
      style={fieldStyles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.inkFaint}
      keyboardType={keyboardType ?? "default"}
    />
  </View>
);

const fieldStyles = StyleSheet.create({
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginBottom: 6,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 2,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
});

// ---------------------------------------------------------------------------
// Mini TimePicker
// ---------------------------------------------------------------------------

const HOURS_24 = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const MINUTES = ["00", "15", "30", "45"];

const TimePickerInline = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) => {
  const [hh, mm] = value.split(":");
  const [hour, setHour] = useState(hh ?? "12");
  const [minute, setMinute] = useState(mm ?? "30");

  const update = (h: string, m: string) => {
    setHour(h);
    setMinute(m);
    onChange(`${h}:${m}`);
  };

  return (
    <View style={tpStyles.row}>
      <View style={tpStyles.column}>
        {HOURS_24.map((h) => (
          <TouchableOpacity
            key={h}
            style={[tpStyles.cell, hour === h && tpStyles.cellSelected]}
            onPress={() => update(h, minute)}
          >
            <Text
              style={[
                tpStyles.cellText,
                hour === h && tpStyles.cellTextSelected,
              ]}
            >
              {h}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={tpStyles.separator}>:</Text>
      <View style={tpStyles.column}>
        {MINUTES.map((m) => (
          <TouchableOpacity
            key={m}
            style={[tpStyles.cell, minute === m && tpStyles.cellSelected]}
            onPress={() => update(hour, m)}
          >
            <Text
              style={[
                tpStyles.cellText,
                minute === m && tpStyles.cellTextSelected,
              ]}
            >
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const tpStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginTop: 8,
  },
  column: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
    gap: 6,
  },
  separator: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    paddingTop: 6,
  },
  cell: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 42,
    alignItems: "center",
  },
  cellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cellText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  cellTextSelected: {
    color: colors.white,
    fontFamily: fontFamily.bold,
  },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const AddReminderBottomSheet = forwardRef<
  AddReminderBottomSheetRef,
  Props
>(({ onAdd, onClose }, ref) => {
  const sheetRef = useRef<AppBottomSheetRef>(null);
  const [data, setData] = useState<ReminderData>(DEFAULT_REMINDER);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const patch = useCallback((partial: Partial<ReminderData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  useImperativeHandle(ref, () => ({
    open: () => {
      setData(DEFAULT_REMINDER);
      setShowTimePicker(false);
      sheetRef.current?.open();
    },
    close: () => sheetRef.current?.close(),
  }));

  const handleAdd = () => {
    onAdd?.(data);
    sheetRef.current?.close();
  };

  const canAdd = data.drugName.trim().length > 0;

  return (
    <AppBottomSheet
      ref={sheetRef}
      snapPoints={["70%", "92%"]}
      onClose={onClose}
      scrollable
      containerStyle={styles.sheet}
    >
      <Text style={styles.title}>Nouveau rappel</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          Nom du médicament<Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.nameInput}
          value={data.drugName}
          onChangeText={(t) => patch({ drugName: t })}
          placeholder="Ex: Amoxicilline"
          placeholderTextColor={colors.inkFaint}
        />
      </View>

      <View style={[styles.field, { zIndex: 300 }]}>
        <InlineDropdown
          label="Forme"
          value={data.form}
          options={FORMS}
          onSelect={(v) => patch({ form: v })}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Dosage</Text>
        <View style={styles.dosageRow}>
          <TextInput
            style={[styles.nameInput, { flex: 1 }]}
            value={data.dosageValue}
            onChangeText={(t) => patch({ dosageValue: t })}
            placeholder="500"
            placeholderTextColor={colors.inkFaint}
            keyboardType="numeric"
          />
          <InlineDropdown
            value={data.dosageUnit}
            options={DOSAGE_UNITS}
            onSelect={(v) => patch({ dosageUnit: v })}
            style={{ width: 80, zIndex: 200 }}
          />
        </View>
      </View>

      <View style={[styles.field, { zIndex: 100 }]}>
        <Text style={styles.fieldLabel}>Fréquence (Nombre de fois/Unité)</Text>
        <View style={styles.freqRow}>
          <InlineDropdown
            value={data.frequencyUnit}
            options={FREQUENCY_UNITS}
            onSelect={(v) => patch({ frequencyUnit: v })}
            style={{ flex: 1, zIndex: 100 }}
          />
          <TextInput
            style={[styles.nameInput, { width: 48, textAlign: "center" }]}
            value={data.frequencyCount}
            onChangeText={(t) => patch({ frequencyCount: t })}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.field}>
        <FieldInput
          label="Interval des prises"
          value={data.intervalDays}
          onChangeText={(t) => patch({ intervalDays: t })}
          placeholder="Nombre de jours (Par défaut: 0)"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Heure</Text>
        <TouchableOpacity
          style={styles.timeBtn}
          onPress={() => setShowTimePicker((v) => !v)}
        >
          <Ionicons name="alarm-outline" size={18} color={colors.inkMuted} />
          <Text style={styles.timeBtnText}>{data.time}</Text>
          <Ionicons
            name={showTimePicker ? "chevron-up" : "chevron-down"}
            size={15}
            color={colors.inkMuted}
          />
        </TouchableOpacity>
        {showTimePicker && (
          <TimePickerInline
            value={data.time}
            onChange={(t) => patch({ time: t })}
          />
        )}
      </View>

      <PrimaryButton
        label="Ajouter"
        variant="solid"
        size="md"
        onPress={handleAdd}
        isDisabled={!canAdd}
        style={styles.cta}
      />
    </AppBottomSheet>
  );
});

AddReminderBottomSheet.displayName = "AddReminderBottomSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
    marginBottom: 20,
    marginTop: 4,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginBottom: 6,
  },
  required: {
    color: colors.error ?? "#E53935",
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  dosageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  freqRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  timeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  timeBtnText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  cta: {
    marginTop: 8,
    marginBottom: Platform.OS === "ios" ? 24 : 12,
  },
});
