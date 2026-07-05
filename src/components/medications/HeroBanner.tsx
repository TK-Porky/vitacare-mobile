import {
  TouchableOpacity,
  ImageBackground,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { colors, fontFamily, fontSize } from "@/themes";

type HeroBannerProps = {
  title: string;
  subtitle: string;
  imageUrl: string;
  onPress?: () => void;
};

export const HeroBanner = ({
  title,
  subtitle,
  imageUrl,
  onPress,
}: HeroBannerProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.heroBannerWrapper}
      onPress={onPress}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.heroBanner}
        imageStyle={styles.heroBannerImage}
      >
        <View style={styles.heroBannerOverlay}>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  heroBannerWrapper: {
    marginTop: 4,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  heroBanner: {
    height: 160,
    justifyContent: "flex-end",
  },
  heroBannerImage: {
    borderRadius: 20,
  },
  heroBannerOverlay: {
    backgroundColor: "rgba(10, 30, 20, 0.5)",
    padding: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.white,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 18,
  },
});
