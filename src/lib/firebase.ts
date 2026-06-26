import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeAuth, 
  // @ts-ignore - getReactNativePersistence is sometimes not exported in types but exists in runtime for RN
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ================================================================================== //
// Config Firebase
// ================================================================================== //
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDMgfqRiqBvrtl292qdA15uaEue5sU9YVg',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'vitacare-7faee.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'vitacare-7faee',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'vitacare-7faee.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '146440416531',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:146440416531:android:eed87605b43e3962673ee6',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// ================================================================================== //
// Initialize Firebase
// ================================================================================== //
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ================================================================================== //
// Initialize Auth with persistence
// ================================================================================== //
export const firebaseAuth = initializeAuth(app, {
  persistence: (getReactNativePersistence as any)(AsyncStorage),
});

export default app;