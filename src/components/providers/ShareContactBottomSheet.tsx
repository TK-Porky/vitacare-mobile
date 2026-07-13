// components/providers/ShareContactBottomSheet.tsx
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  memo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Share,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { AppBottomSheet, AppBottomSheetRef } from "../generics";
import { PrimaryButton } from "../buttons";
import { colors, fontFamily, fontSize } from "../../themes";
import { Provider } from "./ProfessionalProviderBottomSheet";

// ================================================================================== //
// Types
// ================================================================================== //

export type ShareContactBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  provider: Provider;
  onClose?: () => void;
};

// ================================================================================== //
// Interfaces
// ================================================================================== //

interface ShareOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  action: (provider: Provider) => Promise<void> | void;
  color: string;
}

// ================================================================================== //
// Components
// ================================================================================== //

/**
 * Share option button
 */
const ShareOptionButton = memo(
  ({ option, onPress }: { option: ShareOption; onPress: () => void }) => {
    const { t } = useTranslation();
    return (
    <TouchableOpacity
      style={styles.optionButton}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={t('share.accessibilityShareVia', { label: option.label })}
      accessibilityRole="button"
    >
      <View
        style={[styles.optionIcon, { backgroundColor: option.color + "15" }]}
      >
        <Ionicons name={option.icon} size={24} color={option.color} />
      </View>
      <Text style={styles.optionLabel}>{option.label}</Text>
    </TouchableOpacity>
    );
  },
);

ShareOptionButton.displayName = "ShareOptionButton";

// ================================================================================== //
// Main Component
// ================================================================================== //

export const ShareContactBottomSheet = forwardRef<
  ShareContactBottomSheetRef,
  Props
>(({ provider, onClose }, ref) => {
  const { t } = useTranslation();
  const sheetRef = useRef<AppBottomSheetRef>(null);

  const SHARE_OPTIONS: ShareOption[] = [
    {
      id: "whatsapp",
      icon: "logo-whatsapp",
      label: t('share.whatsapp'),
      action: async (provider) => {
        const message = `👨‍⚕️ *${provider.doctorName}*\n🏥 ${provider.clinicName}\n📍 ${provider.location}\n📞 ${provider.phone || t('provider.notSpecified')}\n🌐 ${provider.website || t('provider.notSpecified')}`;
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        try {
          await Linking.openURL(url);
        } catch {
          Alert.alert(t('common.error'), t('share.whatsappNotInstalled'));
        }
      },
      color: "#25D366",
    },
    {
      id: "sms",
      icon: "chatbubble-outline",
      label: t('share.sms'),
      action: async (provider) => {
        const message = `👨‍⚕️ ${provider.doctorName}\n🏥 ${provider.clinicName}\n📍 ${provider.location}`;
        const url = `sms:${provider.phone || ""}?body=${encodeURIComponent(message)}`;
        try {
          await Linking.openURL(url);
        } catch {
          Alert.alert(t('common.error'), t('share.smsError'));
        }
      },
      color: colors.primary,
    },
    {
      id: "email",
      icon: "mail-outline",
      label: t('share.email'),
      action: async (provider) => {
        const subject = `Contact - ${provider.doctorName}`;
        const body = `👨‍⚕️ ${provider.doctorName}\n🏥 ${provider.clinicName}\n📍 ${provider.location}\n📞 ${provider.phone || t('provider.notSpecified')}`;
        const url = `mailto:${provider.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        try {
          await Linking.openURL(url);
        } catch {
          Alert.alert(t('common.error'), t('share.emailError'));
        }
      },
      color: "#EA4335",
    },
    {
      id: "copy",
      icon: "copy-outline",
      label: t('share.copy'),
      action: async (provider) => {
        const contact = `👨‍⚕️ ${provider.doctorName}\n🏥 ${provider.clinicName}\n📍 ${provider.location}\n📞 ${provider.phone || t('provider.notSpecified')}\n🌐 ${provider.website || t('provider.notSpecified')}`;
        await Clipboard.setStringAsync(contact);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          t('common.success'),
          t('share.successCopied'),
        );
      },
      color: "#6B7280",
    },
    {
      id: "share",
      icon: "share-outline",
      label: t('share.share'),
      action: async (provider) => {
        const message = `👨‍⚕️ ${provider.doctorName}\n🏥 ${provider.clinicName}\n📍 ${provider.location}\n📞 ${provider.phone || t('provider.notSpecified')}`;
        await Share.share({
          message,
          title: `Contact - ${provider.doctorName}`,
        });
      },
      color: "#4285F4",
    },
  ];

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.open(),
    close: () => sheetRef.current?.close(),
  }));

  const handleOptionPress = useCallback(
    async (option: ShareOption) => {
      try {
        await option.action(provider);
        sheetRef.current?.close();
      } catch (error) {
        console.error("Share action error:", error);
        Alert.alert(t('common.error'), t('share.actionError'));
      }
    },
    [provider],
  );

  return (
    <AppBottomSheet
      ref={sheetRef}
      snapPoints={["40%", "60%"]}
      onClose={onClose}
      containerStyle={styles.sheet}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('share.title')}</Text>
        <Text style={styles.subtitle}>
          {t('share.subtitle', { name: provider.doctorName })}
        </Text>
      </View>

      <View style={styles.optionsGrid}>
        {SHARE_OPTIONS.map((option) => (
          <ShareOptionButton
            key={option.id}
            option={option}
            onPress={() => handleOptionPress(option)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => sheetRef.current?.close()}
        activeOpacity={0.7}
        accessibilityLabel={t('share.accessibilityClose')}
        accessibilityRole="button"
      >
        <Text style={styles.closeButtonText}>{t('share.close')}</Text>
      </TouchableOpacity>
    </AppBottomSheet>
  );
});

ShareContactBottomSheet.displayName = "ShareContactBottomSheet";

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    textAlign: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 16,
  },
  optionButton: {
    alignItems: "center",
    gap: 8,
    width: 80,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.ink,
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closeButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.inkLight,
  },
});
