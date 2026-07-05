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
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { colors, fontFamily, fontSize } from "@/themes";
import { AppBottomSheet, AppBottomSheetRef } from "@/components/generics";
import { PrimaryButton } from "@/components/buttons";

// ================================================================================== //
// Types
// ================================================================================== //

export type SupportContactBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  onClose?: () => void;
};

// ================================================================================== //
// Constants
// ================================================================================== //

const SUPPORT_INFO = {
  email: "support@vitacare.com",
  phone: "+237 6XX XX XX XX",
  whatsapp: "+237 6XX XX XX XX",
  hours: "Lun - Ven, 8h - 18h",
  website: "www.vitacare.com",
};

interface ContactOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  action: () => Promise<void> | void;
  color: string;
}

// ================================================================================== //
// Components
// ================================================================================== //

/**
 * Contact option button
 */
const ContactOptionButton = memo(
  ({ option, onPress }: { option: ContactOption; onPress: () => void }) => (
    <TouchableOpacity
      style={styles.optionButton}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Contacter par ${option.label}`}
      accessibilityRole="button"
    >
      <View
        style={[styles.optionIcon, { backgroundColor: option.color + "15" }]}
      >
        <Ionicons name={option.icon} size={22} color={option.color} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionLabel}>{option.label}</Text>
        <Text style={styles.optionValue} numberOfLines={1}>
          {option.value}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inkLight} />
    </TouchableOpacity>
  ),
);

ContactOptionButton.displayName = "ContactOptionButton";

/**
 * Support hours component
 */
const SupportHours = memo(() => (
  <View style={styles.hoursContainer}>
    <Ionicons name="time-outline" size={16} color={colors.inkLight} />
    <Text style={styles.hoursText}>
      Disponible du <Text style={styles.hoursBold}>{SUPPORT_INFO.hours}</Text>
    </Text>
  </View>
));

SupportHours.displayName = "SupportHours";

// ================================================================================== //
// Main Component
// ================================================================================== //

export const SupportContactBottomSheet = forwardRef<
  SupportContactBottomSheetRef,
  Props
>(({ onClose }, ref) => {
  const sheetRef = useRef<AppBottomSheetRef>(null);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.open(),
    close: () => sheetRef.current?.close(),
  }));

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleEmailPress = useCallback(async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await Linking.openURL(`mailto:${SUPPORT_INFO.email}`);
      sheetRef.current?.close();
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir l'application email. Veuillez envoyer un email à " +
          SUPPORT_INFO.email,
      );
    }
  }, []);

  const handlePhonePress = useCallback(async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await Linking.openURL(`tel:${SUPPORT_INFO.phone}`);
      sheetRef.current?.close();
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir l'application téléphone. Veuillez appeler le " +
          SUPPORT_INFO.phone,
      );
    }
  }, []);

  const handleWhatsAppPress = useCallback(async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await Linking.openURL(`whatsapp://send?phone=${SUPPORT_INFO.whatsapp}`);
      sheetRef.current?.close();
    } catch (error) {
      Alert.alert(
        "Erreur",
        "WhatsApp n'est pas installé sur cet appareil. Veuillez contacter le " +
          SUPPORT_INFO.whatsapp,
      );
    }
  }, []);

  const handleCopyEmail = useCallback(async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await Clipboard.setStringAsync(SUPPORT_INFO.email);
    Alert.alert(
      "Copié !",
      "L'adresse email a été copiée dans le presse-papier.",
    );
    sheetRef.current?.close();
  }, []);

  const handleCopyPhone = useCallback(async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await Clipboard.setStringAsync(SUPPORT_INFO.phone);
    Alert.alert(
      "Copié !",
      "Le numéro de téléphone a été copié dans le presse-papier.",
    );
    sheetRef.current?.close();
  }, []);

  // ─── Contact Options ──────────────────────────────────────────────────────

  const contactOptions: ContactOption[] = [
    {
      id: "email",
      icon: "mail-outline",
      label: "Email",
      value: SUPPORT_INFO.email,
      action: handleEmailPress,
      color: "#EA4335",
    },
    {
      id: "phone",
      icon: "call-outline",
      label: "Téléphone",
      value: SUPPORT_INFO.phone,
      action: handlePhonePress,
      color: "#34A853",
    },
    {
      id: "whatsapp",
      icon: "logo-whatsapp",
      label: "WhatsApp",
      value: SUPPORT_INFO.whatsapp,
      action: handleWhatsAppPress,
      color: "#25D366",
    },
  ];

  return (
    <AppBottomSheet
      ref={sheetRef}
      snapPoints={["45%", "60%"]}
      onClose={onClose}
      containerStyle={styles.sheet}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.handle} />
        <Text style={styles.title}>Contacter le support</Text>
        <Text style={styles.subtitle}>Notre équipe est là pour vous aider</Text>
      </View>

      {/* ── Hours ── */}
      <SupportHours />

      {/* ── Contact Options ── */}
      <View style={styles.optionsContainer}>
        {contactOptions.map((option) => (
          <ContactOptionButton
            key={option.id}
            option={option}
            onPress={option.action}
          />
        ))}
      </View>

      {/* ── Copy Actions ── */}
      <View style={styles.copyContainer}>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyEmail}
          activeOpacity={0.7}
        >
          <Ionicons name="copy-outline" size={16} color={colors.primary} />
          <Text style={styles.copyButtonText}>Copier l'email</Text>
        </TouchableOpacity>

        <View style={styles.copyDivider} />

        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyPhone}
          activeOpacity={0.7}
        >
          <Ionicons name="copy-outline" size={16} color={colors.primary} />
          <Text style={styles.copyButtonText}>Copier le téléphone</Text>
        </TouchableOpacity>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <PrimaryButton
          label="Fermer"
          variant="outline"
          size="md"
          fullWidth
          onPress={() => sheetRef.current?.close()}
        />
      </View>
    </AppBottomSheet>
  );
});

SupportContactBottomSheet.displayName = "SupportContactBottomSheet";

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
  },

  // Header
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

  // Hours
  hoursContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    justifyContent: "center",
  },
  hoursText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  hoursBold: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },

  // Options
  optionsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  optionValue: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
  },

  // Copy
  copyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  copyButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  copyDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },

  // Footer
  footer: {
    marginTop: 8,
  },
});
