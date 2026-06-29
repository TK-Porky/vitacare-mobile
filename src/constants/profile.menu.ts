import { MenuSectionItem } from "@/components/display/MenuSection";
import { PROFILE_ROUTES } from "@/constants/routes";

export const MENU_SECTIONS: { title: string; items: MenuSectionItem[] }[] = [
  {
    title: "Généraux",
    items: [
      {
        id: "info",
        icon: "person-outline",
        label: "Mes Informations",
        subText: "Modifier avatar, email, numéro de téléphone",
        route: PROFILE_ROUTES.EDIT_PROFILE,
      },
      {
        id: "activity",
        icon: "time-outline",
        label: "Mon activité",
        subText: "Accéder à mes médicaments et rappels",
        route: PROFILE_ROUTES.ACTIVITY,
      },
      {
        id: "location",
        icon: "location-outline",
        label: "Ma localisation",
        subText: "Paramétrer ma position",
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
    title: "Accessibilité",
    items: [
      {
        id: "lang",
        icon: "globe-outline",
        label: "Changer la langue",
        subText: "Choisir votre langue",
        route: PROFILE_ROUTES.LANGUAGE,
      },
    ],
  },
  {
    title: "Sécurité",
    items: [
      {
        id: "password",
        icon: "lock-closed-outline",
        label: "Modifier son mot de passe",
        subText: "Modifier son mot de passe",
        route: PROFILE_ROUTES.CHANGE_PASSWORD,
      },
      {
        id: "notifications",
        icon: "notifications-outline",
        label: "Notifications",
        subText: "Paramétrer ses notifications",
        route: PROFILE_ROUTES.NOTIFICATIONS,
      },
    ],
  },
  {
    title: "Assistance",
    items: [
      {
        id: "help",
        icon: "help-circle-outline",
        label: "Aide",
        subText: "Contactez notre support",
        route: PROFILE_ROUTES.HELP,
      },
      {
        id: "terms",
        icon: "document-text-outline",
        label: "Termes et Conditions d'utilisation",
        subText: "Consulter les termes et conditions",
        route: PROFILE_ROUTES.TERMS,
      },
    ],
  },
];

export const DANGER_SECTION = {
  title: "Compte",
  items: [
    {
      id: "logout",
      icon: "log-out-outline",
      label: "Se déconnecter",
      subText: "Se déconnecter de votre compte",
      danger: true,
      showChevron: false,
    },
    {
      id: "delete",
      icon: "person-remove-outline",
      label: "Supprimer mon compte",
      subText: "Supprimer définitivement votre compte",
      danger: true,
      showChevron: false,
    },
  ],
};
