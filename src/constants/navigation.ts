import { colors, fontFamily } from "@/themes";

// Utiliser des fonctions qui retournent des options inline
export const AUTH_SCREEN_OPTIONS = {
  headerShown: false,
  animation: "slide_from_bottom" as const,
  gestureEnabled: true,
  gestureDirection: "horizontal" as const,
};

export const AUTH_SCREEN_OPTIONS_RIGHT = {
  headerShown: false,
  animation: "slide_from_right" as const,
  gestureEnabled: true,
  gestureDirection: "horizontal" as const,
};

export const AUTH_SCREEN_OPTIONS_FADE = {
  headerShown: false,
  animation: "fade" as const,
  gestureEnabled: false,
};

// Fonction pour les options avec header
export const getAuthScreenOptionsWithHeader = (title: string) => ({
  headerShown: true,
  headerTitle: title,
  headerBackTitle: "Retour",
  headerStyle: {
    backgroundColor: colors.white,
  },
  headerTitleStyle: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
    fontSize: 18,
  },
  headerShadowVisible: false,
  gestureEnabled: true,
  gestureDirection: "horizontal" as const,
});

// Options pour les modaux
export const MODAL_OPTIONS = {
  presentation: "modal" as const,
  headerShown: false,
  animation: "slide_from_bottom" as const,
  gestureEnabled: true,
  gestureDirection: "vertical" as const,
};
