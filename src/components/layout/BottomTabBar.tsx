import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import { colors, fontFamily, fontSize } from "../../themes";

interface TabItem {
  name: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
}

const TABS: TabItem[] = [
  {
    name: "index",
    path: "/(main)/(tabs)/",
    icon: "home-outline",
    iconActive: "home",
    label: "Accueil",
  },
  {
    name: "explore",
    path: "/(main)/(tabs)/explore",
    icon: "search-outline",
    iconActive: "search",
    label: "Explorer",
  },
  {
    name: "appointments",
    path: "/(main)/(tabs)/appointments",
    icon: "calendar-outline",
    iconActive: "calendar",
    label: "RDV",
  },
  {
    name: "medications",
    path: "/(main)/(tabs)/medications",
    icon: "medical-outline",
    iconActive: "medical",
    label: "Drugs",
  },
  {
    name: "profile",
    path: "/(main)/(tabs)/profile",
    icon: "person-outline",
    iconActive: "person",
    label: "Profil",
  },
];

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const isActive = (tab: TabItem): boolean => {
    if (tab.name === "fab") return false;

    // Normalize pathname: remove trailing slashes
    const normalizedPath = pathname.replace(/\/$/, "");

    if (tab.name === "index") {
      // Index tab: active for root paths
      return (
        normalizedPath === "" ||
        normalizedPath === "/" ||
        normalizedPath === "/(main)/(tabs)" ||
        normalizedPath === "/(main)/(tabs)/index"
      );
    }

    // Other tabs: check if pathname ends with tab name
    return normalizedPath.endsWith(`/${tab.name}`);
  };

  const handlePress = (tab: TabItem) => {
    router.replace(tab.path as any);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {TABS.map((tab) => {
        const active = isActive(tab);
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => handlePress(tab)}
            activeOpacity={0.7}
          >
            {active && <View style={styles.indicator} />}
            <Ionicons
              name={active ? tab.iconActive : tab.icon}
              size={22}
              color={active ? colors.primary : colors.inkLight}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center", // Align items centered for larger displays (tablets)
    alignItems: "center",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    maxWidth: 100, // Keeps an elegant look on wide screens (tablets)
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    position: "relative",
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs, // Dynamic 10px standard size
    fontWeight: "500",
    color: colors.inkFaint,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  indicator: {
    position: "absolute",
    top: -10, // Places the indicator precisely covering the top border of the tab bar
    left: "20%",
    right: "20%",
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.primary,
  },
});
