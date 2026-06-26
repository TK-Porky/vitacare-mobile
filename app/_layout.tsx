import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, router, useSegments } from 'expo-router';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { queryClient } from '../src/lib/query.client';
import { useAuthStore } from '../src/store';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Ignore cosmetic warnings from NativeWind / BottomSheet ref conflicts
LogBox.ignoreLogs([
  "Couldn't find the scrollable node handle id!",
]);

/**
 * Root navigator: handles auth-based routing and registers modal screens.
 * Switching from <Slot> to <Stack> is required so that (modals)/* screens
 * can use presentation: 'modal' and slide up correctly.
 */
function RootNavigator() {
  const hydrate     = useAuthStore((s) => s.hydrate);
  const isHydrated  = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const segments    = useSegments();

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup   = segments[0] === '(auth)';
    const inMainGroup   = segments[0] === '(main)';
    const isOnboarding  = (segments as string[])[1]?.startsWith('onboarding');

    if (!accessToken && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (accessToken && !inMainGroup && !isOnboarding) {
      router.replace('/(main)');
    }
  }, [isHydrated, accessToken, segments]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
      <Stack.Screen
        name="(modals)/notifications"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/notification-settings"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
