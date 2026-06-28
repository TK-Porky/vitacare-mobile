import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  medicationId?: string;
  time: string;
  notes?: string;
};

const createDefaultReminder = (): ReminderData => ({
  drugName: "",
  form: "Gelule",
  dosageValue: "",
  dosageUnit: "mg",
  frequencyUnit: "Semaine",
  frequencyCount: "",
  intervalDays: "",
  time: "12:30",
});

export type AddReminderBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  onAdd?: (data: ReminderData) => void;
  onClose?: () => void;
  isSubmitting?: boolean;
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
  accessibilityLabel,
}: {
  label?: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  style?: object;
  accessibilityLabel?: string;
}) => {
  const [open, setOpen] = useState(false);

  const handlePress = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setOpen((o) => !o);
  };

  const handleSelect = (opt: string) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(opt);
    setOpen(false);
  };

  return (
    <View style={[{ position: "relative" }, style]}>
      {label && <Text style={dropStyles.fieldLabel}>{label}</Text>}
      <TouchableOpacity
        style={dropStyles.trigger}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={
          accessibilityLabel || `Sélectionner ${label || "une option"}`
        }
        accessibilityRole="combobox"
        accessibilityState={{ expanded: open }}
      >
        <Text style={dropStyles.triggerText}>{value}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.inkMuted}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={dropStyles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={dropStyles.menuContainer}>
            <View style={dropStyles.menu}>
              <FlatList
                data={options}
                keyExtractor={(item) => item}
                renderItem={({ item: opt }) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      dropStyles.menuItem,
                      opt === value && dropStyles.menuItemSelected,
                    ]}
                    onPress={() => handleSelect(opt)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Sélectionner ${opt}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        dropStyles.menuItemText,
                        opt === value && dropStyles.menuItemTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    {opt === value && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                style={dropStyles.menuList}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  triggerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: "80%",
    maxHeight: 300,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  menu: {
    borderRadius: 12,
    overflow: "hidden",
  },
  menuList: {
    maxHeight: 280,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemSelected: {
    backgroundColor: colors.primary + "15",
  },
  menuItemText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
    flex: 1,
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
  required,
  multiline,
  numberOfLines,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  style?: object;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={style}>
      {label && (
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={fieldStyles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          fieldStyles.input,
          isFocused && fieldStyles.inputFocused,
          multiline && fieldStyles.inputMultiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        keyboardType={keyboardType ?? "default"}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines || 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginBottom: 6,
  },
  required: {
    color: colors.error || "#E53935",
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.ink,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 12,
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
  const [hour, setHour] = useState(() => value.split(":")[0] || "12");
  const [minute, setMinute] = useState(() => value.split(":")[1] || "30");

  useEffect(() => {
    const [h, m] = value.split(":");
    setHour(h || "12");
    setMinute(m || "30");
  }, [value]);

  const update = useCallback(
    (h: string, m: string) => {
      setHour(h);
      setMinute(m);
      onChange(`${h}:${m}`);
    },
    [onChange],
  );

  const renderHour = useCallback(
    ({ item: h }: { item: string }) => (
      <TouchableOpacity
        key={h}
        style={[tpStyles.cell, hour === h && tpStyles.cellSelected]}
        onPress={() => update(h, minute)}
        activeOpacity={0.7}
        accessibilityLabel={`Heure ${h}`}
        accessibilityRole="button"
        accessibilityState={{ selected: hour === h }}
      >
        <Text
          style={[tpStyles.cellText, hour === h && tpStyles.cellTextSelected]}
        >
          {h}
        </Text>
      </TouchableOpacity>
    ),
    [hour, minute, update],
  );

  const renderMinute = useCallback(
    ({ item: m }: { item: string }) => (
      <TouchableOpacity
        key={m}
        style={[tpStyles.cell, minute === m && tpStyles.cellSelected]}
        onPress={() => update(hour, m)}
        activeOpacity={0.7}
        accessibilityLabel={`Minute ${m}`}
        accessibilityRole="button"
        accessibilityState={{ selected: minute === m }}
      >
        <Text
          style={[tpStyles.cellText, minute === m && tpStyles.cellTextSelected]}
        >
          {m}
        </Text>
      </TouchableOpacity>
    ),
    [hour, minute, update],
  );

  return (
    <View style={tpStyles.container}>
      <View style={tpStyles.row}>
        <View style={tpStyles.column}>
          <Text style={tpStyles.columnLabel}>Heure</Text>
          <FlatList
            data={HOURS_24}
            renderItem={renderHour}
            keyExtractor={(item) => item}
            style={tpStyles.timeList}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={Math.min(Number(hour), 23)}
            getItemLayout={(data, index) => ({
              length: 44,
              offset: 44 * index,
              index,
            })}
          />
        </View>

        <Text style={tpStyles.separator}>:</Text>

        <View style={tpStyles.column}>
          <Text style={tpStyles.columnLabel}>Minute</Text>
          <FlatList
            data={MINUTES}
            renderItem={renderMinute}
            keyExtractor={(item) => item}
            style={tpStyles.timeList}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={MINUTES.indexOf(minute)}
            getItemLayout={(data, index) => ({
              length: 44,
              offset: 44 * index,
              index,
            })}
          />
        </View>
      </View>
    </View>
  );
};

const tpStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  column: {
    flex: 1,
    alignItems: "center",
  },
  columnLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.inkLight,
    marginBottom: 8,
  },
  timeList: {
    maxHeight: 132,
    width: "100%",
  },
  separator: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
    paddingTop: 20,
    paddingHorizontal: 4,
  },
  cell: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
    minHeight: 40,
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
>(({ onAdd, onClose, isSubmitting = false }, ref) => {
  const sheetRef = useRef<AppBottomSheetRef>(null);
  const [data, setData] = useState<ReminderData>(createDefaultReminder);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const patch = useCallback((partial: Partial<ReminderData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  useImperativeHandle(ref, () => ({
    open: () => {
      setData(createDefaultReminder());
      setShowTimePicker(false);
      sheetRef.current?.open();
    },
    close: () => sheetRef.current?.close(),
  }));

  const handleClose = useCallback(() => {
    setData(createDefaultReminder());
    setShowTimePicker(false);
    onClose?.();
  }, [onClose]);

  const handleAdd = useCallback(() => {
    onAdd?.(data);
    sheetRef.current?.close();
  }, [data, onAdd]);

  const canAdd = useMemo(() => {
    const dosageValue = parseFloat(data.dosageValue);
    const frequencyCount = parseFloat(data.frequencyCount);

    return (
      data.drugName.trim().length > 0 &&
      data.form.trim().length > 0 &&
      !isNaN(dosageValue) &&
      dosageValue > 0 &&
      data.dosageUnit.trim().length > 0 &&
      !isNaN(frequencyCount) &&
      frequencyCount > 0 &&
      data.frequencyUnit.trim().length > 0 &&
      data.time.trim().length > 0
    );
  }, [data]);

  const renderFormFields = useCallback(() => {
    return (
      <>
        <View style={styles.field}>
          <FieldInput
            label="Nom du médicament"
            value={data.drugName}
            onChangeText={(t) => patch({ drugName: t })}
            placeholder="Ex: Amoxicilline"
            required
          />
        </View>

        <View style={[styles.field, { zIndex: 300 }]}>
          <InlineDropdown
            label="Forme"
            value={data.form}
            options={FORMS}
            onSelect={(v) => patch({ form: v })}
            accessibilityLabel="Sélectionner la forme du médicament"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Dosage<Text style={styles.required}> *</Text>
          </Text>
          <View style={styles.dosageRow}>
            <FieldInput
              value={data.dosageValue}
              onChangeText={(t) => patch({ dosageValue: t })}
              placeholder="500"
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
            <InlineDropdown
              value={data.dosageUnit}
              options={DOSAGE_UNITS}
              onSelect={(v) => patch({ dosageUnit: v })}
              style={{ width: 100 }}
              accessibilityLabel="Sélectionner l'unité de dosage"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Fréquence (nombre de fois par unité)
            <Text style={styles.required}> *</Text>
          </Text>
          <View style={styles.freqRow}>
            <InlineDropdown
              value={data.frequencyUnit}
              options={FREQUENCY_UNITS}
              onSelect={(v) => patch({ frequencyUnit: v })}
              style={{ flex: 1 }}
              accessibilityLabel="Sélectionner l'unité de fréquence"
            />
            <FieldInput
              value={data.frequencyCount}
              onChangeText={(t) => patch({ frequencyCount: t })}
              placeholder="1"
              keyboardType="numeric"
              style={{ width: 70 }}
            />
          </View>
        </View>

        <View style={styles.field}>
          <FieldInput
            label="Interval des prises (en jours)"
            value={data.intervalDays}
            onChangeText={(t) => patch({ intervalDays: t })}
            placeholder="0 (par défaut)"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Heure<Text style={styles.required}> *</Text>
          </Text>
          <TouchableOpacity
            style={[styles.timeBtn, showTimePicker && styles.timeBtnActive]}
            onPress={() => {
              if (Platform.OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setShowTimePicker((v) => !v);
            }}
            activeOpacity={0.7}
            accessibilityLabel="Sélectionner l'heure"
            accessibilityRole="button"
            accessibilityState={{ expanded: showTimePicker }}
          >
            <Ionicons name="alarm-outline" size={20} color={colors.primary} />
            <Text style={styles.timeBtnText}>{data.time}</Text>
            <Ionicons
              name={showTimePicker ? "chevron-up" : "chevron-down"}
              size={18}
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

        <View style={styles.field}>
          <FieldInput
            label="Notes (optionnel)"
            value={data.notes || ""}
            onChangeText={(t) => patch({ notes: t })}
            placeholder="Ajoutez des notes supplémentaires..."
            multiline
            numberOfLines={3}
          />
        </View>
      </>
    );
  }, [data, patch, showTimePicker]);

  return (
    <AppBottomSheet
      ref={sheetRef}
      snapPoints={["70%", "92%"]}
      onClose={handleClose}
      scrollable
      containerStyle={styles.sheet}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Nouveau rappel</Text>
        <TouchableOpacity
          onPress={() => sheetRef.current?.close()}
          style={styles.closeBtn}
          accessibilityLabel="Fermer"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={colors.inkLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        {renderFormFields()}

        <PrimaryButton
          label={isSubmitting ? "Ajout en cours..." : "Ajouter le rappel"}
          variant="solid"
          size="md"
          onPress={handleAdd}
          isDisabled={!canAdd || isSubmitting}
          isLoading={isSubmitting}
          style={styles.cta}
        />
      </View>
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
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
  },
  formContainer: {
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 4,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 20,
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
    color: colors.error || "#E53935",
  },
  dosageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  freqRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  timeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  timeBtnActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  timeBtnText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  cta: {
    marginTop: 8,
    marginBottom: Platform.OS === "ios" ? 8 : 4,
  },
});
