import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  unreadCount: number;
  color?: string;
}

/**
 * A bell icon button that shows an unread badge.
 * Drop this into your Expo Router stack header:
 *
 *   <Stack.Screen
 *     name="(tabs)"
 *     options={{
 *       headerRight: () => <NotificationBell unreadCount={unreadCount} />,
 *     }}
 *   />
 */
export function NotificationBell({ unreadCount, color = '#111827' }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => router.push('/(modals)/notifications')}
      accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
      accessibilityRole="button"
    >
      <Text style={[styles.bellIcon, { color }]}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
