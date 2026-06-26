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
  searchBar?: boolean;
  searchValue?: string;
  onSearch?: () => void;
  onSearchChange?: (value: string) => void;
  onSearchFocus?: () => void;
  onMap?: () => void;
  onReminders?: () => void;
  onFilter?: () => void;
  rightActions?: React.ReactNode;
  notificationBell?: React.ReactNode;
};

export function AppHeader({
  title,
  searchBar,
  searchValue,
  onSearch,
  onSearchFocus,
  onMap,
  onReminders,
  onFilter,
  rightActions,
  notificationBell,
}: Props) {
  const statusBarHeight = StatusBar.currentHeight ?? 50;
  const hideLogo = !!title;

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
              >
                <Search size={20} color={colors.ink} />
              </TouchableOpacity>
            )}
            {onFilter && (
              <TouchableOpacity
                onPress={onFilter}
                activeOpacity={0.7}
                style={styles.iconButton}
              >
                <Filter size={20} color={colors.ink} />
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
              <View pointerEvents={onSearchFocus ? "none" : "auto"}>
                <SearchInput
                  value={searchValue || ""}
                  onChangeText={() => {}}
                />
              </View>
              {onSearchFocus && (
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  onPress={onSearchFocus}
                  activeOpacity={0.7}
                />
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
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize["2xl"],
    color: colors.ink,
  },
});
