import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";
import { AuthButton } from "@/components/auth/AuthButton";

const { width, height } = Dimensions.get("window");

// Type pour chaque slide
export type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  animation: any; // Lottie animation (JSON ou URL)
};

interface OnboardingCarouselProps {
  slides: OnboardingSlide[];
  onComplete: () => void;
  onSkip?: () => void;
}

export const OnboardingCarousel = ({
  slides,
  onComplete,
  onSkip,
}: OnboardingCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const animationRefs = useRef<(LottieView | null)[]>([]);

  // ✅ Plus aucune timeline d'animation séparée : la position horizontale
  // est calculée DIRECTEMENT depuis currentIndex à chaque rendu. Dots et
  // slide affichée dépendent alors de la même valeur, lue au même instant
  // -> aucun décalage possible, plus aucune animation qui pourrait être
  // interrompue ou retardée par le rendu des LottieView.
  const translateX = -currentIndex * width;

  const handleNext = () => {
    // ✅ Mise à jour fonctionnelle du state : on ne lit jamais
    // "currentIndex" depuis une closure potentiellement obsolète,
    // on part toujours de la dernière valeur réelle connue de React.
    setCurrentIndex((prev) => {
      if (prev < slides.length - 1) {
        return prev + 1;
      }
      onComplete();
      return prev;
    });
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <View style={styles.paginationWrapper}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Bouton Skip */}
      <TouchableOpacity
        onPress={handleSkip}
        style={styles.skipButton}
        accessibilityLabel="Passer l'introduction"
        accessibilityRole="button"
      >
        <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>

      {/* Carousel : une rangée de "width * slides.length" que l'on décale via transform */}
      <View style={styles.carouselViewport}>
        <View
          style={[
            styles.track,
            {
              width: width * slides.length,
              transform: [{ translateX }],
            },
          ]}
        >
          {slides.map((item, index) => (
            <View key={item.id} style={styles.slide}>
              <View style={styles.animationContainer}>
                <LottieView
                  ref={(ref) => {
                    animationRefs.current[index] = ref;
                  }}
                  source={item.animation}
                  style={styles.animation}
                  autoPlay
                  loop={true}
                  speed={0.8}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Pagination */}
      {renderPagination()}

      {/* Bouton Next / Get Started */}
      <View style={styles.bottomContainer}>
        <AuthButton
          label={currentIndex === slides.length - 1 ? "Commencer" : "Suivant"}
          onPress={handleNext}
          variant="primary"
          fullWidth
          icon={
            <Ionicons
              name={
                currentIndex === slides.length - 1
                  ? "checkmark"
                  : "arrow-forward"
              }
              size={20}
              color={colors.white}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  carouselViewport: {
    flex: 1,
    width,
    overflow: "hidden",
  },
  track: {
    flex: 1,
    flexDirection: "row",
  },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  animationContainer: {
    width: width * 0.75,
    height: height * 0.35,
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  animation: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    textAlign: "center",
    lineHeight: 24,
  },
  skipButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    right: 20,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  paginationContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 120 : 100,
    width: "100%",
    alignItems: "center",
  },
  paginationWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 28,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.border,
  },
  bottomContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30,
    left: 24,
    right: 24,
  },
});
