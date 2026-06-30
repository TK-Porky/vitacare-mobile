import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Search, Filter } from "lucide-react-native";
import { SearchInput } from "../inputs/SearchInput";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { colors, fontFamily, fontSize } from "../../themes";

type Props = {
  title?: string;
  showLogo?: boolean;
  searchBar?: boolean;
  searchValue?: string;
  onSearch?: () => void;
  onSearchChange?: (value: string) => void;
  onSearchFocus?: () => void;
  onSearchClose?: () => void;
  isSearching?: boolean;
  onMap?: () => void;
  onReminders?: () => void;
  onFilter?: () => void;
  onNotification?: () => void;
  notificationCount?: number;
  rightActions?: React.ReactNode;
  notificationBell?: React.ReactNode;
};

export function AppHeader({
  title,
  showLogo,
  searchBar,
  searchValue = "",
  onSearch,
  onSearchChange,
  onSearchFocus,
  onSearchClose,
  isSearching = false,
  onMap,
  onReminders,
  onFilter,
  onNotification,
  notificationCount = 0,
  rightActions,
  notificationBell,
}: Props) {
  const statusBarHeight = StatusBar.currentHeight ?? 50;
  const hideLogo = !!title || showLogo == false;

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight + 8 }]}>
      <View style={styles.topContainer}>
        {/* Logo */}
        <View style={styles.logo}>
          {!hideLogo && (
            <>
              <Ionicons name="heart-outline" size={24} color={colors.ink} />
              <Text style={styles.logoText}>VitaCare</Text>
            </>
          )}
        </View>

        {/* rightActions a priorité sur les actions individuelles */}
        {rightActions ? (
          <View style={styles.actions}>{rightActions}</View>
        ) : (
          <View style={styles.actions}>
            {!searchBar && (
              <TouchableOpacity
                onPress={onSearch}
                activeOpacity={0.7}
                style={styles.iconButton}
                accessibilityLabel="Rechercher"
                accessibilityRole="button"
                accessibilityHint="Ouvrir la recherche"
              >
                <Search size={20} color={colors.ink} />
              </TouchableOpacity>
            )}
            {onFilter && (
              <TouchableOpacity
                onPress={onFilter}
                activeOpacity={0.7}
                style={styles.iconButton}
                accessibilityLabel="Filtrer"
                accessibilityRole="button"
                accessibilityHint="Filtrer les éléments affichés"
              >
                <Filter size={20} color={colors.ink} />
              </TouchableOpacity>
            )}
            {onNotification && (
              <TouchableOpacity
                onPress={onNotification}
                activeOpacity={0.7}
                style={styles.iconButton}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
                accessibilityHint="Voir vos notifications"
              >
                <View style={styles.notificationContainer}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color={colors.ink}
                  />
                  {notificationCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            {onMap && (
              <PrimaryButton
                label="Carte"
                onPress={onMap}
                icon={<Ionicons name="map" size={16} color={colors.white} />}
                style={styles.mapButton}
                size="sm"
              />
            )}
            {onReminders && !onMap && (
              <PrimaryButton
                label="Rappels"
                onPress={onReminders}
                icon={
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.white}
                  />
                }
                size="sm"
                style={styles.mapButton}
              />
            )}
            {notificationBell}
          </View>
        )}
      </View>

      {(title || searchBar) && (
        <View style={styles.bottomContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          {searchBar && (
            <View style={styles.searchWrap}>
              <SearchInput
                value={searchValue}
                onChangeText={onSearchChange || (() => {})}
                onFocus={onSearchFocus}
                accessibilityLabel="Rechercher"
                accessibilityHint="Saisissez votre recherche"
              />
              {isSearching && onSearchClose && (
                <TouchableOpacity
                  style={styles.searchCloseButton}
                  onPress={onSearchClose}
                  activeOpacity={0.7}
                  accessibilityLabel="Fermer la recherche"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={20} color={colors.ink} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 2,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  topContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  logoText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  notificationContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.error || "#DC2626",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
  mapButton: {
    width: 100,
    gap: 1,
  },
  bottomContainer: {
    width: "100%",
    paddingTop: 8,
  },
  searchWrap: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  searchCloseButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 4,
    zIndex: 10,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
  },
});
