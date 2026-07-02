// services/auth.service.ts
import {
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  getIdToken,
  ConfirmationResult,
  AuthError,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { apiClient } from "../lib/api.client";
import { LoginEmailInput, RegisterInput } from "../schemas/auth.schema";
import { API_ENDPOINTS } from "../types/api-endpoints";
import { auth } from "@/firebase/config";

// ================================================================================== //
// Types
// ================================================================================== //

// Auth Tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// User Profile
export interface UserProfile {
  id: string;
  email?: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  medicalHistory?: string;
  address?: string;
}

export interface BackendAuthResponse {
  accessToken: string;
  refreshToken?: string;
  patient: UserProfile;
}

// Auth Result
export interface AuthResult {
  tokens: AuthTokens;
  user: UserProfile;
}

// Google Login Data
export interface GoogleLoginData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  idToken: string;
}

let _confirmationResult: ConfirmationResult | null = null;

// ================================================================================== //
// Helpers
// ================================================================================== //

/**
 * Map Firebase Auth errors to user-friendly messages
 */
const mapAuthError = (error: any): string => {
  const code = (error as AuthError)?.code;

  switch (code) {
    case "auth/email-already-in-use":
      return "Cette adresse email est déjà utilisée.";
    case "auth/invalid-email":
      return "Adresse email invalide.";
    case "auth/operation-not-allowed":
      return "Opération non autorisée.";
    case "auth/weak-password":
      return "Le mot de passe est trop faible.";
    case "auth/user-disabled":
      return "Ce compte a été désactivé.";
    case "auth/user-not-found":
      return "Aucun utilisateur trouvé avec cet email.";
    case "auth/wrong-password":
      return "Mot de passe incorrect.";
    case "auth/invalid-verification-code":
      return "Code de vérification invalide.";
    case "auth/invalid-verification-id":
      return "ID de vérification invalide.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Veuillez réessayer plus tard.";
    case "auth/network-request-failed":
      return "Erreur réseau. Vérifiez votre connexion.";
    case "auth/popup-closed-by-user":
      return "La fenêtre de connexion a été fermée.";
    case "auth/cancelled-popup-request":
      return "La demande de connexion a été annulée.";
    case "auth/popup-blocked":
      return "La fenêtre de connexion a été bloquée.";
    default:
      return (
        error?.message ?? "Une erreur est survenue lors de l'authentification."
      );
  }
};

/**
 * Handle auth result from backend
 */
const handleBackendAuthResponse = async (
  response: any,
): Promise<AuthResult> => {
  if (!response.success || !response.data) {
    throw new Error(response.error ?? "Erreur serveur");
  }

  const payload = response.data as BackendAuthResponse;
  return {
    tokens: {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken ?? "",
    },
    user: payload.patient,
  };
};

// ================================================================================== //
// Service
// ================================================================================== //

export const authService = {
  // ────────────────────────────────────────────────────────────────────────────────
  // Phone Authentication
  // ────────────────────────────────────────────────────────────────────────────────

  /**
   * Send OTP for phone number verification
   * @param phone - Phone number without country code (e.g., "6XXXXXXXX")
   */
  async sendOtp(phone: string): Promise<void> {
    try {
      _confirmationResult = await signInWithPhoneNumber(
        auth,
        `+237${phone}`, // Cameroon country code
      );
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  },

  /**
   * Verify OTP for phone login/registration
   * @param code - OTP code (6 digits)
   * @param fullName - Optional full name for registration
   */
  async verifyOtp(code: string, fullName?: string): Promise<AuthResult> {
    if (!_confirmationResult) {
      throw new Error("Aucune demande OTP en cours. Veuillez réessayer.");
    }

    try {
      const credential = await _confirmationResult.confirm(code);
      const firebaseToken = await getIdToken(credential.user);
      _confirmationResult = null;

      const res = await apiClient.post<BackendAuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN_PHONE,
        { fullName, firebaseToken },
      );

      return await handleBackendAuthResponse(res);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  },

  // ────────────────────────────────────────────────────────────────────────────────
  // Email/Password Authentication
  // ────────────────────────────────────────────────────────────────────────────────

  /**
   * Login with email and password
   * @param data - Login email input
   * @returns Auth result
   */
  async loginWithEmail(data: LoginEmailInput): Promise<AuthResult> {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      const firebaseToken = await getIdToken(credential.user);

      const res = await apiClient.post<BackendAuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN_EMAIL,
        {
          firebaseToken,
          rememberMe: data.rememberMe || false,
        },
      );

      return await handleBackendAuthResponse(res);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  },

  // ────────────────────────────────────────────────────────────────────────────────
  // Google Authentication
  // ────────────────────────────────────────────────────────────────────────────────

  /**
   * Login with Google via Firebase credential
   * @param data - Google login data from OAuth
   * @returns Auth result
   */
  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    try {
      const res = await apiClient.post<BackendAuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN_GOOGLE,
        { idToken },
      );

      return await handleBackendAuthResponse(res);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  },

  // ────────────────────────────────────────────────────────────────────────────────
  // Registration
  // ────────────────────────────────────────────────────────────────────────────────

  /**
   * Register new user (Email or Phone)
   * @param data - Register input
   * @returns Auth result or OTP requirement
   */
  async register(
    data: RegisterInput,
  ): Promise<{ requiresOtp: boolean } | AuthResult> {
    if (data.mode === "phone") {
      return { requiresOtp: true };
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email!,
        data.password!,
      );
      const firebaseToken = await getIdToken(credential.user);

      const res = await apiClient.post<BackendAuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER_EMAIL,
        {
          fullName: data.fullName,
          firebaseToken,
          email: data.email,
        },
      );

      console.log("✅ Registration response:", res);
      return await handleBackendAuthResponse(res);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  },

  // ────────────────────────────────────────────────────────────────────────────────
  // Password Reset
  // ────────────────────────────────────────────────────────────────────────────────

  /**
   * Send password reset email
   * @param email - User's email
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);

      const res = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email,
      });
      if (!res.success) {
        throw new Error(res.error ?? "Erreur serveur");
      }
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  },

  /**
   * Verify password reset OTP
   * @param email - User's email
   * @param otp - OTP code
   */
  async verifyPasswordResetOtp(email: string, otp: string): Promise<void> {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD_VERIFY, {
      email,
      otp,
    });
    if (!res.success) {
      throw new Error(res.error ?? "Code invalide ou expiré");
    }
  },

  /**
   * Reset password after OTP verification
   * @param email - User's email
   * @param password - New password
   */
  async resetPassword(email: string, password: string): Promise<void> {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      password,
    });
    if (!res.success) {
      throw new Error(res.error ?? "Erreur lors de la réinitialisation");
    }
  },

  // ────────────────────────────────────────────────────────────────────────────────
  // Logout
  // ────────────────────────────────────────────────────────────────────────────────

  /**
   * Logout user from Firebase and backend
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Firebase signOut error:", error);
    }
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT).catch(() => {});
  },

  // ────────────────────────────────────────────────────────────────────────────────
  // Token Management
  // ────────────────────────────────────────────────────────────────────────────────

  /**
   * Get current Firebase ID token
   */
  async getFirebaseToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        return await getIdToken(user);
      }
      return null;
    } catch (error) {
      console.error("Error getting Firebase token:", error);
      return null;
    }
  },

  /**
   * Refresh Firebase ID token
   */
  async refreshFirebaseToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        await user.getIdToken(true); // Force refresh
        return await getIdToken(user);
      }
      return null;
    } catch (error) {
      console.error("Error refreshing Firebase token:", error);
      return null;
    }
  },

  // ────────────────────────────────────────────────────────────────────────────────
  // Phone Number Helpers
  // ────────────────────────────────────────────────────────────────────────────────

  /**
   * Format phone number for Firebase
   * @param phone - Raw phone number
   * @param countryCode - Country code (default: +237 for Cameroon)
   * @returns Formatted phone number
   */
  formatPhoneNumber(phone: string, countryCode: string = "+237"): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // If number starts with 00, replace with +
    if (cleaned.startsWith("00")) {
      return "+" + cleaned.substring(2);
    }

    // If number already has country code
    if (cleaned.startsWith(countryCode.substring(1))) {
      return "+" + cleaned;
    }

    // Add country code
    return countryCode + cleaned;
  },
};

// ================================================================================== //
// Export types for use in other files
// ================================================================================== //

export type { AuthError } from "firebase/auth";
