// Routes d'authentification
export const AUTH_ROUTES = {
  INDEX: "index",
  LOGIN_PHONE: "login-phone",
  LOGIN_EMAIL: "login-email",
  FORGOT_PASSWORD: "forgot-password",
  OTP: "otp",
  REGISTER: "register",
  ONBOARDING: "onboarding",
} as const;

// Routes d'onboarding
export const ONBOARDING_ROUTES = {
  LOCATION: "location",
  SEARCH: "search",
  LANGUAGE: "language",
  SUCCESS: "success",
} as const;

// Routes principales (app)
export const APP_ROUTES = {
  HOME: "/(main)",
  BOOKING: "/(main)/booking",
  EXPLORE: "/(main)/explore",
  PROFILE: "/(main)/profile",
  APPOINTMENTS: "/(main)/appointments",
  MEDICATIONS: "/(main)/medications",
} as const;

// Routes modales
export const MODAL_ROUTES = {
  NOTIFICATIONS: "/(modals)/notifications",
  FILTER: "/(modals)/filter",
} as const;

// Routes de profil
export const PROFILE_ROUTES = {
  EDIT_PROFILE: "/(main)/profile/edit-profile",
  ACTIVITY: "/(main)/profile/activity",
  LOCATION: "/(main)/profile/location",
  DOWNLOADS: "/(main)/profile/downloads",
  CHANGE_PASSWORD: "/(main)/profile/change-password",
  NOTIFICATIONS: "/(main)/profile/notifications-settings",
  LANGUAGE: "/(main)/profile/language-settings",
  HELP: "/(main)/profile/help",
  TERMS: "/(main)/profile/terms",
  CONFIRM_DELETE: "/(main)/profile/confirm-delete",
} as const;

// Type pour les routes
export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
export type OnboardingRoute =
  (typeof ONBOARDING_ROUTES)[keyof typeof ONBOARDING_ROUTES];
export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
export type ModalRoute = (typeof MODAL_ROUTES)[keyof typeof MODAL_ROUTES];
