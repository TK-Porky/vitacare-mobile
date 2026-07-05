import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/generics";
import { PrimaryButton } from "@/components/buttons";
import { colors, fontFamily, fontSize } from "@/themes";
import {
  ReminderData,
  AddReminderBottomSheetRef,
  Props,
  FORMS,
  DOSAGE_UNITS,
  FREQUENCY_UNITS,
  createDefaultReminder,
} from "./types";
import { InlineDropdown } from "./InlineDropdown";
import { FieldInput } from "./FieldInput";
import { TimePickerInline } from "./TimePickerInline";

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
              color={colors.ink}
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
