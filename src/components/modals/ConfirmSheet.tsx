import React, { forwardRef, useRef, useImperativeHandle, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, fontFamily, fontSize } from "@/themes";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/generics";
import { PrimaryButton } from "@/components/buttons";

export type ConfirmSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
};

export const ConfirmSheet = forwardRef<ConfirmSheetRef, Props>(
  (
    {
      title,
      message,
      confirmLabel,
      cancelLabel,
      onConfirm,
      onCancel,
      destructive,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const sheetRef = useRef<AppBottomSheetRef>(null);

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    const handleConfirm = useCallback(() => {
      sheetRef.current?.close();
      onConfirm();
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
      sheetRef.current?.close();
      onCancel?.();
    }, [onCancel]);

    return (
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={["30%"]}
        allowPanDownToClose
        scrollable={false}
      >
        <View style={styles.container}>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <PrimaryButton
              label={confirmLabel || t("common.confirm")}
              onPress={handleConfirm}
              variant="solid"
              fullWidth
              size="md"
            />
            <PrimaryButton
              label={cancelLabel || t("common.cancel")}
              onPress={handleCancel}
              variant="outline"
              fullWidth
              size="md"
            />
          </View>
        </View>
      </AppBottomSheet>
    );
  },
);

ConfirmSheet.displayName = "ConfirmSheet";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    textAlign: "center",
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    gap: 10,
  },
});
