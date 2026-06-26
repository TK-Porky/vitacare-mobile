import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "../../../src/themes";
import { router } from "expo-router";
import { useAuthStore } from "../../../src/store";
import { profileService } from "../../../src/services/profile.service";

// ================================================================================== //
// Types
// ================================================================================== //
type MenuSection = {
  title: string;
  items: {
    id: string;
    icon: string;
    label: string;
    subText: string;
  }[];
};

// ================================================================================== //
// Constants
// ================================================================================== //
const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Généraux",
    items: [
      {
        id: "info",
        icon: "person-outline",
        label: "Mes Informations",
        subText: "Modifier avatar, email, numéro de téléphone",
      },
      {
        id: "activity",
        icon: "time-outline",
        label: "Mon activité",
        subText: "Accéder à mes médicaments et rappels",
      },
      {
        id: "location",
        icon: "location-outline",
        label: "Ma localisation",
        subText: "Paramétrer ma position",
      },
      {
        id: "downloads",
        icon: "download-outline",
        label: "Mes Téléchargements",
        subText: "Accéder à mes ordonnances et résultats",
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
      },
      {
        id: "notifications",
        icon: "notifications-outline",
        label: "Notifications",
        subText: "Paramétrer ses notifications",
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
      },
      {
        id: "terms",
        icon: "document-text-outline",
        label: "Termes et Conditions d'utilisation",
        subText: "Consulter les termes et conditions",
      },
    ],
  },
];

// ================================================================================== //
// Components
// ================================================================================== //

/**
 * Menu item component
 * @param icon - The icon to display
 * @param label - The label to display
 * @param subText - The sub text to display
 * @param danger - Whether the item is dangerous
 * @param onPress - The function to call when the item is pressed
 */
function MenuItem({
  icon,
  label,
  subText,
  danger = false,
  onPress,
}: {
  icon: string;
  label: string;
  subText?: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconWrapper]}>
        <Ionicons
          name={icon as any}
          size={18}
          color={danger ? colors.error : colors.primaryDark}
        />
      </View>
      <View style={styles.menuLabelWrapper}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
          {label}
        </Text>
        <Text style={styles.menuSubText}>{subText}</Text>
      </View>
      {!danger && <Feather name="chevron-right" size={16} color={colors.ink} />}
    </TouchableOpacity>
  );
}

/**
 * Menu section component
 * @param title - The title of the section
 * @param items - The items in the section
 */
function MenuSection({
  title,
  items,
}: {
  title: string;
  items: (typeof MENU_SECTIONS)[0]["items"];
}) {
  const handlePress = (id: string) => {
    switch (id) {
      case "info":
        router.push("/(main)/profile/edit-profile");
        break;
      case "activity":
        router.push("/(main)/profile/activity");
        break;
      case "location":
        router.push("/(main)/profile/location");
        break;
      case "downloads":
        router.push("/(main)/profile/downloads");
        break;
      case "password":
        router.push("/(main)/profile/change-password");
        break;
      case "notifications":
        router.push("/(main)/profile/notifications-settings");
        break;
      case "lang":
        router.push("/(main)/profile/language-settings");
        break;
      case "help":
        router.push("/(main)/profile/help");
        break;
      case "terms":
        router.push("/(main)/profile/terms");
        break;
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, index) => (
          <View key={item.id}>
            <MenuItem
              icon={item.icon}
              label={item.label}
              subText={item.subText}
              onPress={() => handlePress(item.id)}
            />
            {index < items.length - 1 && <View style={styles.itemDivider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

// ================================================================================== //
// Main
// ================================================================================== //
export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
  }, []);

  // Safe check for the user's avatar URL
  const avatarUri =
    user?.avatarUrl || "https://randomuser.me/api/portraits/men/75.jpg";

  // ================================================================================== //
  // Handlers
  // ================================================================================== //
  const handleDisconnection = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (err) {
            Alert.alert("Erreur", "Impossible de se déconnecter.");
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Suppression de compte",
      "ATTENTION : Cette action est définitive et toutes vos données seront supprimées. Êtes-vous sûr ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            if (Platform.OS === "ios") {
              Alert.prompt(
                "Confirmer la suppression",
                "Veuillez saisir votre mot de passe pour confirmer la suppression définitive de votre compte :",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Confirmer la suppression",
                    style: "destructive",
                    onPress: async (password?: string) => {
                      if (!password) {
                        Alert.alert("Erreur", "Mot de passe requis.");
                        return;
                      }
                      try {
                        await profileService.deleteAccount({
                          password,
                          confirmDeletion: true,
                        });
                        await logout();
                      } catch (err: any) {
                        Alert.alert(
                          "Erreur",
                          err.message || "Échec de la suppression.",
                        );
                      }
                    },
                  },
                ],
                "secure-text",
              );
            } else {
              // Android fallback or redirect
              Alert.alert(
                "Validation requise",
                "Pour confirmer la suppression de votre compte, veuillez modifier votre mot de passe ou contacter le support pour valider l'identité.",
                [{ text: "Ok", style: "default" }],
              );
            }
          },
        },
      ],
    );
  };

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.primary} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Page title ── */}
        <Text style={styles.pageTitle}>Votre Profile</Text>

        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          </View>
          <Text style={styles.userName}>{user?.fullName ?? "Utilisateur"}</Text>
          <Text style={styles.userPhone}>
            {user?.phoneNumber ?? user?.email ?? "Utilisateur"}
          </Text>

          <TouchableOpacity
            style={styles.locationBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/(main)/profile/location")}
          >
            <Ionicons name="location-outline" size={16} color="#fff" />
            <Text style={styles.locationBtnText}>
              {user?.address ?? "Localisation non renseignée"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Menu sections ── */}
        {MENU_SECTIONS.map((section) => (
          <MenuSection
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}

        {/* ── Compte (danger zone) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon="log-out-outline"
              label="Se déconnecter"
              onPress={handleDisconnection}
              danger
            />
            <View style={styles.itemDivider} />
            <MenuItem
              icon="person-remove-outline"
              label="Supprimer mon compte"
              onPress={handleDeleteAccount}
              danger
            />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ================================================================================== //
// Styles
// ================================================================================== //
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // Page title
  pageTitle: {
    fontSize: fontSize["2xl"],
    fontFamily: fontFamily.bold,
    color: colors.ink,
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },

  // Profile card
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 28,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "rgba(34,197,94,0.3)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
    marginBottom: 4,
  },
  userPhone: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    marginBottom: 16,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryMid,
    paddingVertical: 12,
    borderRadius: 30,
    width: "100%",
    justifyContent: "center",
    shadowColor: "rgba(34,197,94,0.35)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  locationBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.white,
  },

  // Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.inkLight,
    letterSpacing: 0.3,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 16,
    backgroundColor: colors.white,
  },

  // Menu items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconWrapper: {
    width: 24,
    height: 24,
    backgroundColor: `${colors.gray100}`,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabelWrapper: {
    flex: 1,
  },
  menuSubText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },

  menuLabel: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  menuLabelDanger: {
    color: colors.error,
    fontFamily: fontFamily.semiBold,
  },
  itemDivider: {
    height: 0,
    backgroundColor: colors.border,
    marginLeft: 66,
  },
});
