import {
    signInWithPhoneNumber,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    getIdToken,
    ConfirmationResult,
    AuthError,
  } from "firebase/auth";
  import { firebaseAuth } from "../lib/firebase"; 
  import { apiClient } from "../lib/api.client";
  import { LoginEmailInput, RegisterInput } from "../schemas/auth.schema";
import { API_ENDPOINTS } from "../types/api-endpoints";
  
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
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée.';
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/operation-not-allowed':
        return 'Opération non autorisée.';
      case 'auth/weak-password':
        return 'Le mot de passe est trop faible.';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé.';
      case 'auth/user-not-found':
        return 'Aucun utilisateur trouvé avec cet email.';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect.';
      case 'auth/invalid-verification-code':
        return 'Code de vérification invalide.';
      case 'auth/invalid-verification-id':
        return 'ID de vérification invalide.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Veuillez réessayer plus tard.';
      default:
        return error?.message ?? "Une erreur est survenue lors de l'authentification.";
    }
  };

  // ================================================================================== //
  // Service
  // ================================================================================== //
  export const authService = {
  
    /**
     * Send OTP
     * @param phone 
     * @param appVerifier 
     */
    async sendOtp(phone: string): Promise<void> {
      try {
        _confirmationResult = await signInWithPhoneNumber(
          firebaseAuth,
          `+237${phone}`,
        );
      } catch (error) {
        throw new Error(mapAuthError(error));
      }
    },
  
    /**
     * Verify OTP
     * @param code
     * @param fullName Optional fullName for registration
     */
    async verifyOtp(code: string, fullName?: string): Promise<AuthResult> {
      if (!_confirmationResult) throw new Error("Aucune demande OTP en cours.");
  
      try {
        const credential = await _confirmationResult.confirm(code);
        const firebaseToken = await getIdToken(credential.user);
        _confirmationResult = null;
    
        const res = await apiClient.post<BackendAuthResponse>(
          API_ENDPOINTS.AUTH.LOGIN_PHONE,
          { fullName, firebaseToken }
        );
        if (!res.success || !res.data) throw new Error(res.error ?? "Erreur serveur");
        const payload = res.data;
        return {
          tokens: {
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken ?? '',
          },
          user: payload.patient,
        };
      } catch (error) {
        throw new Error(mapAuthError(error));
      }
    },
  
    /**
     * Login with email and password
     * @param data Login email input
     * @returns Auth result
     */
    async loginWithEmail(data: LoginEmailInput): Promise<AuthResult> {
      try {
        const credential = await signInWithEmailAndPassword(
          firebaseAuth, data.email, data.password
        );
        const firebaseToken = await getIdToken(credential.user);
    
        const res = await apiClient.post<BackendAuthResponse>(
          API_ENDPOINTS.AUTH.LOGIN_EMAIL,
          { firebaseToken }
        );
        console.log("Full Response:", res);
        if (!res.success || !res.data) throw new Error(res.error ?? "Erreur serveur");
        const payload = res.data;
        return {
          tokens: {
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken ?? '',
          },
          user: payload.patient,
        };
      } catch (error) {
        throw new Error(mapAuthError(error));
      }
    },
  
    /**
     * Register
     * @param data Register input
     * @returns Auth result
     */
    async register(data: RegisterInput): Promise<{ requiresOtp: boolean } | AuthResult> {
      if (data.mode === "phone") {
        return { requiresOtp: true };
      }
  
      try {
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth, data.email!, data.password!
        );
        const firebaseToken = await getIdToken(credential.user);
    
        const res = await apiClient.post<BackendAuthResponse>(
          API_ENDPOINTS.AUTH.REGISTER_EMAIL,
          { fullName: data.fullName, firebaseToken }
        );
        console.log("Full Response:", res);
        if (!res.success || !res.data) throw new Error(res.error ?? "Erreur serveur");
        const payload = res.data;
        return {
          tokens: {
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken ?? '',
          },
          user: payload.patient,
        };
      } catch (error) {
        throw new Error(mapAuthError(error));
      }
    },
  
    /**
     * Forgot password
     * @param email Email
     * @returns Promise<void>
     */
    async forgotPassword(email: string): Promise<void> {
      try {
        await sendPasswordResetEmail(firebaseAuth, email);
        // On informe aussi le backend si nécessaire via forgotPassword endpoint
        const res = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
        if (!res.success) throw new Error(res.error ?? "Erreur serveur");
      } catch (error) {
        throw new Error(mapAuthError(error));
      }
    },

    /**
     * Verify password reset OTP
     * @param email Email
     * @param otp OTP code
     * @returns Promise<void>
     */
    async verifyPasswordResetOtp(email: string, otp: string): Promise<void> {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD_VERIFY, { email, otp });
      if (!res.success) throw new Error(res.error ?? "Code invalide ou expiré");
    },

    /**
     * Reset password
     * @param data Reset data
     * @returns Promise<void>
     */
    async resetPassword(email: string, password: string): Promise<void> {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email, password });
      if (!res.success) throw new Error(res.error ?? "Erreur lors de la réinitialisation");
    },

    /**
     * Logout     * @returns Promise<void>
     */
    async logout(): Promise<void> {
      await signOut(firebaseAuth);
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT).catch(() => {}); // best-effort
    },
  };