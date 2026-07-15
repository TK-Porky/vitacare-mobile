import React, { forwardRef, useRef, useImperativeHandle, useState, useCallback } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { colors, fontFamily, fontSize } from "@/themes";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/generics";
import { PrimaryButton } from "@/components/buttons";

export type DatePickerSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  value?: string;
  onChange: (dateString: string) => void;
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value?: string): Date {
  if (!value) return new Date(2000, 0, 1);
  const parts = value.split("-");
  if (parts.length === 3) return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  return new Date(2000, 0, 1);
}

export const DatePickerSheet = forwardRef<DatePickerSheetRef, Props>(
  ({ value, onChange }, ref) => {
    const { t } = useTranslation();
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [internalDate, setInternalDate] = useState(parseDate(value));

    useImperativeHandle(ref, () => ({
      open: () => {
        setInternalDate(parseDate(value));
        sheetRef.current?.open();
      },
      close: () => sheetRef.current?.close(),
    }));

    const handleChange = useCallback(
      (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) {
          setInternalDate(selectedDate);
          if (Platform.OS === "android") {
            onChange(formatDate(selectedDate));
            sheetRef.current?.close();
          }
        }
      },
      [onChange],
    );

    const handleConfirm = useCallback(() => {
      onChange(formatDate(internalDate));
      sheetRef.current?.close();
    }, [internalDate, onChange]);

    return (
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={["40%"]}
        allowPanDownToClose
        scrollable={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>{t("profile.editScreen.dob")}</Text>
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={internalDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleChange}
              maximumDate={new Date()}
            />
          </View>
          {Platform.OS === "ios" && (
            <PrimaryButton
              label={t("common.confirm")}
              onPress={handleConfirm}
              fullWidth
              size="md"
            />
          )}
        </View>
      </AppBottomSheet>
    );
  },
);

DatePickerSheet.displayName = "DatePickerSheet";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
    alignItems: "center",
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  pickerWrapper: {
    width: "100%",
    alignItems: "center",
  },
});
