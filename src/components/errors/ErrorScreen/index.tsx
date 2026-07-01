import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, fontFamily, fontSize } from "@/themes";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import {
  SupportContactBottomSheet,
  SupportContactBottomSheetRef,
} from "@/components/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ErrorType =
  | "network"
  | "server"
  | "payment"
  | "notFound"
  | "generic";

type Props = {
  visible: boolean;
  type?: ErrorType;
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
  retryLabel?: string;
  showSupport?: boolean;
};

// ─── Configuration ────────────────────────────────────────────────────────────

const ERROR_CONFIG: Record<
  ErrorType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    defaultTitle: string;
    defaultMessage: string;
  }
> = {
  network: {
    icon: "wifi-outline",
    defaultTitle: "Problème de connexion",
    defaultMessage: "Veuillez vérifier votre connexion internet et réessayer.",
  },
  server: {
    icon: "server-outline",
    defaultTitle: "Erreur serveur",
    defaultMessage:
      "Une erreur est survenue sur nos serveurs. Nous travaillons à résoudre le problème.",
  },
  payment: {
    icon: "card-outline",
    defaultTitle: "Paiement échoué",
    defaultMessage:
      "Votre paiement n'a pas pu être traité. Vérifiez vos informations bancaires.",
  },
  notFound: {
    icon: "search-outline",
    defaultTitle: "Page non trouvée",
    defaultMessage:
      "La page que vous recherchez n'existe pas ou a été déplacée.",
  },
  generic: {
    icon: "alert-circle-outline",
    defaultTitle: "Une erreur est survenue",
    defaultMessage: "Veuillez réessayer ou contacter le support.",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ErrorScreen({
  visible,
  type = "generic",
  title,
  message,
  errorCode,
  onRetry,
  onGoBack,
  onContactSupport,
  retryLabel = "Réessayer",
  showSupport = true,
  supportSheetRef,
}: Props & {
  supportSheetRef?: React.RefObject<SupportContactBottomSheetRef>;
}) {
  const config = ERROR_CONFIG[type];
  const finalTitle = title || config.defaultTitle;
  const finalMessage = message || config.defaultMessage;

  const handleRetry = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onRetry?.();
  };

  const handleContactSupport = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (supportSheetRef?.current) {
      supportSheetRef.current.open();
    } else {
      onContactSupport?.();
    }
  };

  const handleGoBack = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onGoBack?.();
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconRing, styles.iconRingError]}>
            <Ionicons name={config.icon} size={48} color={colors.white} />
          </View>
        </View>

        {/* Error Code (optional) */}
        {errorCode && <Text style={styles.errorCode}>Erreur {errorCode}</Text>}

        {/* Title */}
        <Text style={styles.title}>{finalTitle}</Text>

        {/* Message */}
        <Text style={styles.message}>{finalMessage}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          {onRetry && (
            <PrimaryButton
              label={retryLabel}
              fullWidth
              onPress={handleRetry}
              size="lg"
              icon={
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={colors.white}
                />
              }
              style={styles.retryButton}
            />
          )}

          <View style={styles.secondaryActions}>
            {onGoBack && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGoBack}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={20}
                  color={colors.inkLight}
                />
                <Text style={styles.secondaryButtonText}>Retour</Text>
              </TouchableOpacity>
            )}

            {showSupport && onContactSupport && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleContactSupport}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={colors.inkLight}
                />
                <Text style={styles.secondaryButtonText}>
                  Contacter le support
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },

  // Icon
  iconContainer: {
    marginBottom: 24,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRingError: {
    backgroundColor: colors.error || "#E53935",
  },

  // Text
  errorCode: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginBottom: 8,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },

  // Actions
  actions: {
    width: "100%",
    gap: 16,
  },
  retryButton: {
    width: "100%",
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
});
