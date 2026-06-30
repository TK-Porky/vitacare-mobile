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
// Constants
// ================================================================================== //

interface ShareOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  action: (provider: Provider) => Promise<void> | void;
  color: string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    id: "whatsapp",
    icon: "logo-whatsapp",
    label: "WhatsApp",
    action: async (provider) => {
      const message = `👨‍⚕️ *${provider.doctorName}*\n🏥 ${provider.clinicName}\n📍 ${provider.location}\n📞 ${provider.phone || "Non disponible"}\n🌐 ${provider.website || "Non disponible"}`;
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert("Erreur", "WhatsApp n'est pas installé sur cet appareil.");
      }
    },
    color: "#25D366",
  },
  {
    id: "sms",
    icon: "chatbubble-outline",
    label: "SMS",
    action: async (provider) => {
      const message = `👨‍⚕️ ${provider.doctorName}\n🏥 ${provider.clinicName}\n📍 ${provider.location}`;
      const url = `sms:${provider.phone || ""}?body=${encodeURIComponent(message)}`;
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert("Erreur", "Impossible d'envoyer un SMS.");
      }
    },
    color: colors.primary,
  },
  {
    id: "email",
    icon: "mail-outline",
    label: "Email",
    action: async (provider) => {
      const subject = `Contact - ${provider.doctorName}`;
      const body = `👨‍⚕️ ${provider.doctorName}\n🏥 ${provider.clinicName}\n📍 ${provider.location}\n📞 ${provider.phone || "Non disponible"}`;
      const url = `mailto:${provider.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert("Erreur", "Impossible d'envoyer un email.");
      }
    },
    color: "#EA4335",
  },
  {
    id: "copy",
    icon: "copy-outline",
    label: "Copier les coordonnées",
    action: async (provider) => {
      const contact = `👨‍⚕️ ${provider.doctorName}\n🏥 ${provider.clinicName}\n📍 ${provider.location}\n📞 ${provider.phone || "Non disponible"}\n🌐 ${provider.website || "Non disponible"}`;
      await Clipboard.setStringAsync(contact);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Succès",
        "Les coordonnées ont été copiées dans le presse-papier.",
      );
    },
    color: "#6B7280",
  },
  {
    id: "share",
    icon: "share-outline",
    label: "Partager",
    action: async (provider) => {
      const message = `👨‍⚕️ ${provider.doctorName}\n🏥 ${provider.clinicName}\n📍 ${provider.location}\n📞 ${provider.phone || "Non disponible"}`;
      await Share.share({
        message,
        title: `Contact - ${provider.doctorName}`,
      });
    },
    color: "#4285F4",
  },
];

// ================================================================================== //
// Components
// ================================================================================== //

/**
 * Share option button
 */
const ShareOptionButton = memo(
  ({ option, onPress }: { option: ShareOption; onPress: () => void }) => (
    <TouchableOpacity
      style={styles.optionButton}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Partager via ${option.label}`}
      accessibilityRole="button"
    >
      <View
        style={[styles.optionIcon, { backgroundColor: option.color + "15" }]}
      >
        <Ionicons name={option.icon} size={24} color={option.color} />
      </View>
      <Text style={styles.optionLabel}>{option.label}</Text>
    </TouchableOpacity>
  ),
);

ShareOptionButton.displayName = "ShareOptionButton";

// ================================================================================== //
// Main Component
// ================================================================================== //

export const ShareContactBottomSheet = forwardRef<
  ShareContactBottomSheetRef,
  Props
>(({ provider, onClose }, ref) => {
  const sheetRef = useRef<AppBottomSheetRef>(null);

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
        Alert.alert("Erreur", "Impossible d'effectuer cette action.");
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
        <Text style={styles.title}>Partager le contact</Text>
        <Text style={styles.subtitle}>
          Choisissez comment partager les coordonnées de {provider.doctorName}
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
        accessibilityLabel="Fermer"
        accessibilityRole="button"
      >
        <Text style={styles.closeButtonText}>Fermer</Text>
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
