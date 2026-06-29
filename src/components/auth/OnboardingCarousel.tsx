import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
  const flatListRef = useRef<FlatList>(null);
  const animationRefs = useRef<(LottieView | null)[]>([]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: OnboardingSlide;
    index: number;
  }) => (
    <View style={styles.slide}>
      <View style={styles.animationContainer}>
        <LottieView
          ref={(ref) => (animationRefs.current[index] = ref as LottieView)}
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
  );

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

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / (width - 64),
          );
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
        scrollEnabled={true}
        decelerationRate="fast"
        bounces={false}
      />

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
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.black,
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.white,
  },
});
