import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login-phone" options={{     
        headerShown: false,
        animation: "slide_from_bottom"
       }} />
      <Stack.Screen name="login-email" options={{ 
        headerShown: false,
        animation: "slide_from_bottom"
      }} />
      <Stack.Screen name="forgot-password" options={{ 
        headerShown: false, 
        animation: "slide_from_bottom"
      }} />
      <Stack.Screen name="otp" options={{ 
        headerShown: false,
        animation: "slide_from_right"
      }} />
      <Stack.Screen name="register" options={{ 
        headerShown: false, 
        animation: "slide_from_bottom"
      }} />
      <Stack.Screen name="onboarding-location" options={{ 
        headerShown: false, 
        animation: "slide_from_right"
      }} />
      <Stack.Screen name="onboarding-search" options={{ 
        headerShown: false, 
        animation: "slide_from_right"
      }} />
      <Stack.Screen name="onboarding-language" options={{ 
        headerShown: false, 
        animation: "slide_from_right"
      }} />
      <Stack.Screen name="onboarding-success" options={{ headerShown: false }} />
    </Stack>
  );
}