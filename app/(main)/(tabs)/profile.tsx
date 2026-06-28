// app/(main)/profile/index.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, fontFamily, fontSize } from "@/themes";
import { useAuthStore } from "@/store";
import { useProfile } from "@/hooks";
import { profileService } from "@/services/profile.service";
import { ProfileHeader } from "@/components/display/ProfileHeader";
import { MenuSection } from "@/components/display/MenuSection";
import { MenuItem } from "@/components/display/MenuItem";
import { MENU_SECTIONS, DANGER_SECTION } from "@/constants/profile.menu";
import { PROFILE_ROUTES } from "@/constants/profile.routes";

// ================================================================================== //
// Main
// ================================================================================== //
export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isLoading: profileLoading, refetch } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ================================================================================== //
  // Handlers
  // ================================================================================== //

  const handleMenuPress = useCallback(
    (item: { id: string; route?: string }) => {
      if (item.route) {
        router.push(item.route as any);
      }
    },
    [router],
  );

  const handleDisconnection = useCallback(() => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch (err) {
            Alert.alert("Erreur", "Impossible de se déconnecter.");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  }, [logout]);

  const confirmDeleteAccount = useCallback(
    async (password?: string) => {
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
        Alert.alert("Erreur", err.message || "Échec de la suppression.");
      }
    },
    [logout],
  );

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Suppression de compte",
      "⚠️ Attention : Cette action est définitive et toutes vos données seront supprimées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            if (Platform.OS === "ios") {
              Alert.prompt(
                "Confirmer la suppression",
                "Veuillez saisir votre mot de passe pour confirmer :",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Confirmer",
                    style: "destructive",
                    onPress: (password: string | undefined) =>
                      confirmDeleteAccount(password),
                  },
                ],
                "secure-text",
              );
            } else {
              // Android: rediriger vers une page de confirmation
              router.push(PROFILE_ROUTES.CONFIRM_DELETE as any);
            }
          },
        },
      ],
    );
  }, [confirmDeleteAccount, router]);

  const handleDangerItemPress = useCallback(
    (item: { id: string }) => {
      if (item.id === "logout") {
        handleDisconnection();
      } else if (item.id === "delete") {
        handleDeleteAccount();
      }
    },
    [handleDisconnection, handleDeleteAccount],
  );

  // ================================================================================== //
  // Render States
  // ================================================================================== //

  if (profileLoading && !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ================================================================================== //
  // Render
  // ================================================================================== //
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.primary} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={profileLoading}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Page title ── */}
        <Text style={styles.pageTitle}>Votre Profil</Text>

        {/* ── Profile header ── */}
        <ProfileHeader
          fullName={user?.fullName || "Utilisateur"}
          phoneNumber={user?.phoneNumber}
          email={user?.email}
          avatarUrl={user?.avatarUrl}
          address={user?.address}
          onLocationPress={() => router.push(PROFILE_ROUTES.LOCATION as any)}
        />

        {/* ── Menu sections ── */}
        {MENU_SECTIONS.map((section) => (
          <MenuSection
            key={section.title}
            title={section.title}
            items={section.items}
            onItemPress={handleMenuPress}
          />
        ))}

        {/* ── Danger section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{DANGER_SECTION.title}</Text>
          <View style={styles.sectionCard}>
            {DANGER_SECTION.items.map((item, index) => (
              <View key={item.id}>
                <MenuItem
                  icon={item.icon}
                  label={item.label}
                  subText={item.subText}
                  danger={item.danger}
                  showChevron={item.showChevron}
                  onPress={() => handleDangerItemPress(item)}
                />
                {index < DANGER_SECTION.items.length - 1 && (
                  <View style={styles.itemDivider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Logging out overlay ── */}
        {isLoggingOut && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={styles.overlayText}>Déconnexion en cours...</Text>
          </View>
        )}

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

  // Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    letterSpacing: 0.3,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 16,
    backgroundColor: colors.white,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 66,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginTop: 12,
  },

  // Overlay
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  overlayText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.white,
    marginTop: 12,
  },
});
