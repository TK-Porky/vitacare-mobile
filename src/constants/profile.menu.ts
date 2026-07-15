import { TFunction } from "i18next";
import { MenuSectionItem } from "@/components/display/MenuSection";
import { PROFILE_ROUTES } from "@/constants/routes";

export const getMenuSections = (
  t: TFunction
): { title: string; items: MenuSectionItem[] }[] => [
  {
    title: t("profile.sections.general"),
    items: [
      {
        id: "info",
        icon: "person-outline",
        label: t("profile.myInfo"),
        subText: t("profile.editProfile"),
        route: PROFILE_ROUTES.EDIT_PROFILE,
      },
      {
        id: "activity",
        icon: "time-outline",
        label: t("profile.myActivity"),
        subText: t("profile.myActivity"),
        route: PROFILE_ROUTES.ACTIVITY,
      },
      {
        id: "location",
        icon: "location-outline",
        label: t("profile.editScreen.address"),
        subText: t("profile.editScreen.address"),
        route: PROFILE_ROUTES.LOCATION,
      },
      {
        id: "downloads",
        icon: "download-outline",
        label: "Mes Téléchargements",
        subText: "Accéder à mes ordonnances et résultats",
        route: PROFILE_ROUTES.DOWNLOADS,
      },
    ],
  },
  {
    title: t("profile.sections.accessibility"),
    items: [
      {
        id: "lang",
        icon: "globe-outline",
        label: t("profile.language"),
        subText: t("profile.chooseLanguage"),
        route: PROFILE_ROUTES.LANGUAGE,
      },
    ],
  },
  {
    title: t("profile.sections.security"),
    items: [
      {
        id: "password",
        icon: "lock-closed-outline",
        label: t("profile.changePassword"),
        subText: t("profile.changePassword"),
        route: PROFILE_ROUTES.CHANGE_PASSWORD,
      },
      {
        id: "notifications",
        icon: "notifications-outline",
        label: t("profile.notifications"),
        subText: t("profile.notificationSettings"),
        route: PROFILE_ROUTES.NOTIFICATIONS,
      },
    ],
  },
  {
    title: t("profile.sections.support"),
    items: [
      {
        id: "help",
        icon: "help-circle-outline",
        label: t("profile.help"),
        subText: t("profile.helpScreen.contact"),
        route: PROFILE_ROUTES.HELP,
      },
      {
        id: "terms",
        icon: "document-text-outline",
        label: t("profile.terms"),
        subText: t("profile.privacy"),
        route: PROFILE_ROUTES.TERMS,
      },
    ],
  },
];

export const getDangerSection = (
  t: TFunction
): { title: string; items: MenuSectionItem[] } => ({
  title: t("common.info"),
  items: [
    {
      id: "logout",
      icon: "log-out-outline",
      label: t("profile.logout"),
      subText: t("profile.logout"),
      danger: true,
      showChevron: false,
    },
    {
      id: "delete",
      icon: "person-remove-outline",
      label: t("profile.deleteAccount"),
      subText: t("profile.deleteAccount"),
      danger: true,
      showChevron: false,
    },
  ],
});
