import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { colors, fontFamily, fontSize } from "@/themes";
import { AuthButton } from "@/components/auth/AuthButton";
import { OnboardingCarousel } from "@/components/auth/OnboardingCarousel";
import { useAuthStore } from "@/store/auth.store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ANIMATIONS } from "@/constants/animations";

const { width } = Dimensions.get("window");
const ONBOARDING_KEY = "@onboarding_completed";

export default function LandingScreen() {
  const { user, isLoading } = useAuthStore();
  const [showCarousel, setShowCarousel] = React.useState(false);

  // Vérifier si l'onboarding a déjà été vu
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
        setShowCarousel(onboarded !== "true");
      } catch (error) {
        console.error("Error checking onboarding:", error);
        setShowCarousel(true);
      }
    };
    checkOnboarding();
  }, []);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user && !isLoading) {
      router.replace("/(main)");
    }
  }, [user, isLoading]);

  const handleNavigate = (route: string) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route);
  };

  const handleCarouselComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setShowCarousel(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (showCarousel) {
    const slides = [
      {
        id: "1",
        title: "Bienvenue sur VitaCare",
        description:
          "Gérez votre santé en toute simplicité avec notre application.\nPrenez soin de vous et vos proches.",
        animation: ANIMATIONS.doctor,
      },
      {
        id: "2",
        title: "Suivez vos traitements",
        description:
          "Ne manquez plus jamais une prise avec nos rappels intelligents.\nVotre santé, en mains.",
        animation: ANIMATIONS.health,
      },
      {
        id: "3",
        title: "Commencez dès maintenant",
        description:
          "Créez votre compte et prenez le contrôle de votre santé.\nNous sommes là pour vous accompagner.",
        animation: ANIMATIONS.care,
      },
    ];

    return (
      <OnboardingCarousel
        slides={slides}
        onComplete={handleCarouselComplete}
        onSkip={handleCarouselComplete}
      />
    );
  }

  // Écran d'accueil normal
  return (
    <View style={styles.container}>
      {/* ── Illustration avec Lottie ── */}
      <View style={styles.illustrationArea}>
        {/* Animation Lottie principale */}
        <View style={styles.lottieWrapper}>
          <LottieView
            source={ANIMATIONS.welcome}
            style={styles.lottieAnimation}
            autoPlay
            loop
            speed={0.8}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* ── Bas de page ── */}
      <View style={styles.bottom}>
        {/* Copy */}
        <View style={styles.copy}>
          <Text style={styles.copyTitle}>
            {"Votre ecosystème de santé, simplifié."}
          </Text>
          <Text style={styles.copyBody}>
            Prenez rendez-vous, suivez vos traitements et restez en contact avec
            vos médecins en un seul endroit.
          </Text>
        </View>

        {/* CTA principal */}
        <AuthButton
          label="Se connecter avec l'email"
          onPress={() => handleNavigate("/(auth)/login-email")}
          variant="primary"
          fullWidth
          icon={<Ionicons name="mail-outline" size={19} color={colors.white} />}
          size="lg"
        />

        {/* Séparateur */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Secondaires côte à côte */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => handleNavigate("/(auth)/register")}
            activeOpacity={0.7}
            accessibilityLabel="Créer un compte"
            accessibilityRole="button"
          >
            <Ionicons
              name="person-add-outline"
              size={17}
              color={colors.primary}
            />
            <Text style={styles.secondaryText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>

        {/* Légal */}
        <Text style={styles.legal}>
          En continuant, vous acceptez nos{" "}
          <Text
            style={styles.legalLink}
            onPress={() => handleNavigate("/terms")}
          >
            Conditions d'utilisation
          </Text>{" "}
          et notre{" "}
          <Text
            style={styles.legalLink}
            onPress={() => handleNavigate("/privacy")}
          >
            Politique de confidentialité
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },

  // Skip
  skipBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  skipText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },

  // Illustration
  illustrationArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    position: "relative",
    paddingTop: 20,
  },
  lottieWrapper: {
    width: width * 0.6,
    height: width * 0.6,
    alignItems: "center",
    justifyContent: "center",
  },
  lottieAnimation: {
    width: "150%",
    height: "150%",
  },

  // Pagination
  paginationRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginTop: 20,
  },
  pageIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  pageIndicatorActive: {
    width: 20,
    backgroundColor: colors.primary,
  },

  // Bas
  bottom: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 60 : 40,
    gap: 16,
  },
  copy: {
    alignItems: "center",
    gap: 8,
  },
  copyTitle: {
    fontSize: fontSize["2xl"],
    fontFamily: fontFamily.bold,
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  copyBody: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },

  // Séparateur
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },

  // Secondaires
  secondaryRow: {
    flexDirection: "row",
    borderRadius: 50,
    overflow: "hidden",
    backgroundColor: colors.ltsurface,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  secondaryDivider: {
    width: 0.5,
    alignSelf: "stretch",
    backgroundColor: colors.border,
  },
  secondaryText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },

  // Légal
  legal: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 17,
  },
  legalLink: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
});
