import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import i18next from "@/i18n";
import { colors, fontFamily, fontSize } from "../../themes";
import { useNotificationStore } from "@/store";

interface TabItem {
  name: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: boolean;
}

const TABS: TabItem[] = [
  {
    name: "home",
    path: "/(main)/(tabs)/home",
    icon: "home-outline",
    iconActive: "home",
    label: i18next.t('tabs.home'),
  },
  {
    name: "explore",
    path: "/(main)/(tabs)/explore",
    icon: "search-outline",
    iconActive: "search",
    label: i18next.t('tabs.explore'),
  },
  {
    name: "appointments",
    path: "/(main)/(tabs)/appointments",
    icon: "calendar-outline",
    iconActive: "calendar",
    label: i18next.t('tabs.appointments'),
    badge: true,
  },
  {
    name: "medications",
    path: "/(main)/(tabs)/medications",
    icon: "medical-outline",
    iconActive: "medical",
    label: i18next.t('tabs.medications'),
  },
  {
    name: "profile",
    path: "/(main)/(tabs)/profile",
    icon: "person-outline",
    iconActive: "person",
    label: i18next.t('tabs.profile'),
  },
];

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const unreadCount = useNotificationStore((state) => state.unreadCount ?? 0);

  const isActive = (tab: TabItem): boolean => {
    const normalizedPath = pathname.replace(/\/$/, "");

    if (tab.name === "index") {
      return (
        normalizedPath === "" ||
        normalizedPath === "/" ||
        normalizedPath === "/(main)/(tabs)" ||
        normalizedPath === "/(main)/(tabs)/index"
      );
    }

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
        const showBadge = tab.badge && unreadCount > 0;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => handlePress(tab)}
            activeOpacity={0.7}
          >
            {active && <View style={styles.indicator} />}
            <View style={styles.iconWrapper}>
              <Ionicons
                name={active ? tab.iconActive : tab.icon}
                size={22}
                color={active ? colors.primary : colors.inkLight}
              />
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
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
    justifyContent: "center",
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
    maxWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    position: "relative",
  },
  iconWrapper: {
    position: "relative",
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
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
    top: -10,
    left: "20%",
    right: "20%",
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.primary,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
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
});
