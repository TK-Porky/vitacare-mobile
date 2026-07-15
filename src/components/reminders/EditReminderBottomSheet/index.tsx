import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/generics";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { colors, fontFamily, fontSize } from "@/themes";
import { InlineDropdown } from "../AddReminderBottomSheet/InlineDropdown";
import { FieldInput } from "../AddReminderBottomSheet/FieldInput";
import { TimePickerInline } from "../AddReminderBottomSheet/TimePickerInline";
import {
  FREQUENCY_UNITS,
  DOSAGE_UNITS,
  FORMS,
  ReminderData,
} from "../AddReminderBottomSheet/types";
import { ReminderResponse } from "@/types/api-responses";
import { useReminders } from "@/hooks";

export type EditReminderBottomSheetRef = {
  open: (reminder: ReminderResponse) => void;
  close: () => void;
};

type Props = {
  onClose?: () => void;
};

const mapReminderToForm = (reminder: ReminderResponse): ReminderData => {
  const formMap: Record<string, string> = {
    GELULE: "Gelule",
    COMPRIME: "Comprimé",
    SIROP: "Sirop",
    INJECTABLE: "Injectable",
    POMMADE: "Pommade",
    SACHET: "Sachet",
  };
  const frequencyMap: Record<string, string> = {
    QUOTIDIEN: "Jour",
    HEBDOMADAIRE: "Semaine",
    MENSUEL: "Mois",
  };
  // Extraire dosageValue et dosageUnit de la chaîne dosage (ex: "500mg" -> 500, mg)
  const dosageMatch = reminder.dosage?.match(/^(\d+)([a-zA-Z]+)$/);
  const dosageValue = dosageMatch ? dosageMatch[1] : "";
  const dosageUnit = dosageMatch ? dosageMatch[2] : "mg";

  return {
    drugName: reminder.medicationName || "",
    form: formMap[reminder.form || ""] || "Gelule",
    dosageValue,
    dosageUnit: dosageUnit || "mg",
    frequencyUnit: frequencyMap[reminder.frequency || ""] || "Jour",
    frequencyCount: (reminder.times?.length || 1).toString(),
    intervalDays: "",
    time: reminder.scheduledHour || "12:00",
    notes: reminder.notes || "",
  };
};

export const EditReminderBottomSheet = forwardRef<
  EditReminderBottomSheetRef,
  Props
>(({ onClose }, ref) => {
  const { t } = useTranslation();
  const sheetRef = useRef<AppBottomSheetRef>(null);
  const [reminderId, setReminderId] = useState<string | null>(null);
  const [data, setData] = useState<ReminderData>({
    drugName: "",
    form: "Gelule",
    dosageValue: "",
    dosageUnit: "mg",
    frequencyUnit: "Jour",
    frequencyCount: "",
    intervalDays: "",
    time: "12:00",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateReminder, isUpdating } = useReminders();

  useImperativeHandle(ref, () => ({
    open: (reminder) => {
      setReminderId(String(reminder.id));
      setData(mapReminderToForm(reminder));
      sheetRef.current?.open();
    },
    close: () => sheetRef.current?.close(),
  }));

  const patch = useCallback((partial: Partial<ReminderData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!reminderId) return;
    try {
      setIsSubmitting(true);
      const requestData = {
        scheduledHour: data.time,
        dosage: data.dosageValue + data.dosageUnit,
        form: data.form,
        frequency: data.frequencyUnit,
        notes: data.notes,
        medicationName: data.drugName,
        times: [data.time],
        // Ajouter d'autres champs selon besoin backend
      };
      await updateReminder({
        id: reminderId,
        data: requestData,
      });
      sheetRef.current?.close();
      Alert.alert(t("common.success"), t("reminders.edit"));
      if (Platform.OS === "ios")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(t("common.error"), t("reminders.addError"));
    } finally {
      setIsSubmitting(false);
    }
  }, [reminderId, data, updateReminder]);

  const canSave =
    data.drugName.trim().length > 0 && data.time.trim().length > 0;

  return (
    <AppBottomSheet
      ref={sheetRef}
      snapPoints={["70%", "92%"]}
      onClose={onClose}
      scrollable
      containerStyle={styles.sheet}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t("reminders.edit")}</Text>
        <TouchableOpacity
          onPress={() => sheetRef.current?.close()}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={24} color={colors.inkLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.field}>
          <FieldInput
            label={t("reminders.addForm.drugName")}
            value={data.drugName}
            onChangeText={(t) => patch({ drugName: t })}
            placeholder={t("reminders.addForm.drugNamePlaceholder")}
            required
          />
        </View>

        <View style={[styles.field, { zIndex: 300 }]}>
          <InlineDropdown
            label={t("reminders.addForm.form")}
            value={data.form}
            options={FORMS}
            onSelect={(v) => patch({ form: v })}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            {t("reminders.addForm.dosage")} <Text style={styles.required}>*</Text>
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
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            {t("reminders.addForm.frequency")} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.freqRow}>
            <InlineDropdown
              value={data.frequencyUnit}
              options={FREQUENCY_UNITS}
              onSelect={(v) => patch({ frequencyUnit: v })}
              style={{ flex: 1 }}
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
          <Text style={styles.fieldLabel}>
            {t("reminders.addForm.time")} <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.timeBtn}
            onPress={
              () => {} /* Keep time picker visible by default? We'll show inline */
            }
          >
            <Ionicons name="alarm-outline" size={20} color={colors.primary} />
            <Text style={styles.timeBtnText}>{data.time}</Text>
          </TouchableOpacity>
          <TimePickerInline
            value={data.time}
            onChange={(t) => patch({ time: t })}
          />
        </View>

        <View style={styles.field}>
          <FieldInput
            label={t("reminders.addForm.notes")}
            value={data.notes || ""}
            onChangeText={(t) => patch({ notes: t })}
            placeholder={t("reminders.addForm.notes")}
            multiline
            numberOfLines={3}
          />
        </View>

        <PrimaryButton
          label={isSubmitting ? t("common.save") + "..." : t("common.save")}
          variant="solid"
          size="md"
          onPress={handleSave}
          isDisabled={!canSave || isSubmitting}
          isLoading={isSubmitting}
          style={styles.cta}
          fullWidth
        />
      </View>
    </AppBottomSheet>
  );
});

EditReminderBottomSheet.displayName = "EditReminderBottomSheet";

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 20,
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
  closeBtn: { padding: 4 },
  formContainer: { paddingBottom: Platform.OS === "ios" ? 20 : 12 },
  field: { marginBottom: 20 },
  fieldLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginBottom: 6,
  },
  required: { color: colors.error || "#E53935" },
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
    marginBottom: 8,
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
