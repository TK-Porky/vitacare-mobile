import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import { useAuthStore } from "@/store/auth.store";
import type {
  LoginEmailInput,
  OtpInput,
  RegisterInput,
} from "@/schemas/auth.schema";
import { auth } from "@/firebase/config";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// Configure une seule fois au démarrage de l'app
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

export const useAuth = () => {
  const store = useAuthStore();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  /**
   * Google Login
   */
  const googleLogin = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);

    try {
      // Vérifie que Google Play Services est dispo (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Ouvre le sélecteur de compte Google
      const userInfo = await GoogleSignin.signIn();

      // Récupère le idToken
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error("Pas de idToken reçu");

      // Crée le credential Firebase
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      const firebaseToken = await user.getIdToken();

      // Met à jour ton store
      await store.loginWithGoogle({
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
        idToken: firebaseToken,
      });
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // L'utilisateur a annulé — pas d'alerte
        console.log("Google sign-in annulé");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Google sign-in déjà en cours");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Erreur", "Google Play Services non disponible");
      } else {
        console.error("Google sign-in error:", error);
        Alert.alert("Erreur", "Impossible de se connecter avec Google");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // ── Reste des mutations inchangées ─────────────────────────────────────────

  const loginEmailMutation = useMutation({
    mutationFn: (values: LoginEmailInput) => store.loginWithEmail(values),
  });

  const loginPhoneMutation = useMutation({
    mutationFn: ({ phone }: { phone: string }) => store.sendOtp(phone),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (values: OtpInput & { fullName?: string }) =>
      store.verifyOtp(values.code, values.fullName),
  });

  const registerMutation = useMutation({
    mutationFn: ({ data, verifier }: { data: RegisterInput; verifier?: any }) =>
      store.register(data, verifier),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => store.forgotPassword(email),
  });

  const verifyPasswordResetOtpMutation = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      store.verifyPasswordResetOtp(email, otp),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      store.resetPassword(email, password),
  });

  return {
    loginEmail: loginEmailMutation.mutate,
    isLoggingInEmail: loginEmailMutation.isPending,
    loginEmailError: loginEmailMutation.error,

    loginPhone: loginPhoneMutation.mutate,
    isLoggingInPhone: loginPhoneMutation.isPending,

    verifyOtp: verifyOtpMutation.mutate,
    isVerifyingOtp: verifyOtpMutation.isPending,

    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,

    forgotPassword: forgotPasswordMutation.mutateAsync,
    isSendingReset: forgotPasswordMutation.isPending,

    verifyPasswordResetOtp: verifyPasswordResetOtpMutation.mutateAsync,
    isVerifyingResetOtp: verifyPasswordResetOtpMutation.isPending,

    resetPassword: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,

    googleLogin,
    isGoogleLoading,

    logout: store.logout,
  };
};
