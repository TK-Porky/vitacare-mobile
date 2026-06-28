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

export type ProfileRoute = (typeof PROFILE_ROUTES)[keyof typeof PROFILE_ROUTES];
