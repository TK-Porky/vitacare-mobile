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
import { useTranslation } from "react-i18next";
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
    titleKey: string;
    messageKey: string;
  }
> = {
  network: {
    icon: "wifi-outline",
    titleKey: "errorScreen.connectionTitle",
    messageKey: "errorScreen.connectionMessage",
  },
  server: {
    icon: "server-outline",
    titleKey: "errorScreen.serverTitle",
    messageKey: "errorScreen.serverMessage",
  },
  payment: {
    icon: "card-outline",
    titleKey: "errorScreen.paymentTitle",
    messageKey: "errorScreen.paymentMessage",
  },
  notFound: {
    icon: "search-outline",
    titleKey: "errorScreen.pageNotFoundTitle",
    messageKey: "errorScreen.pageNotFoundMessage",
  },
  generic: {
    icon: "alert-circle-outline",
    titleKey: "errorScreen.unknownTitle",
    messageKey: "errorScreen.unknownMessage",
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
  retryLabel,
  showSupport = true,
  supportSheetRef,
}: Props & {
  supportSheetRef?: React.RefObject<SupportContactBottomSheetRef>;
}) {
  const { t } = useTranslation();
  const config = ERROR_CONFIG[type];
  const finalTitle = title || t(config.titleKey);
  const finalMessage = message || t(config.messageKey);
  const resolvedRetryLabel = retryLabel ?? t('common.retry');

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
        {errorCode && <Text style={styles.errorCode}>{t('errorScreen.errorCode')} {errorCode}</Text>}

        {/* Title */}
        <Text style={styles.title}>{finalTitle}</Text>

        {/* Message */}
        <Text style={styles.message}>{finalMessage}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          {onRetry && (
            <PrimaryButton
              label={resolvedRetryLabel}
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
                <Text style={styles.secondaryButtonText}>{t('common.back')}</Text>
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
                  {t('errorScreen.contactSupport')}
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
