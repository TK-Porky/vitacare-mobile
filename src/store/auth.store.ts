// store/auth.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ApplicationVerifier, signOut } from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import {
  authService,
  type AuthResult,
  type UserProfile,
} from "@/services/auth.service";
import i18next from "@/i18n";
import { apiClient } from "@/lib/api.client";
import type { LoginEmailInput, RegisterInput } from "@/schemas/auth.schema";
import { router } from "expo-router";
import { auth } from "@/firebase/config";

// ================================================================================== //
// Constants
// ================================================================================== //

const KEYS = {
  ACCESS_TOKEN: "vitacare_access_token",
  REFRESH_TOKEN: "vitacare_refresh_token",
} as const;

// ================================================================================== //
// Custom Storage for Zustand Persist
// ================================================================================== //

const secureStorage = {
  getItem: (name: string): string | null | Promise<string | null> => {
    return SecureStore.getItemAsync(name);
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    return SecureStore.setItemAsync(name, value);
  },
  removeItem: (name: string): void | Promise<void> => {
    return SecureStore.deleteItemAsync(name);
  },
};

// ================================================================================== //
// State Interface
// ================================================================================== //

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  sendOtp: (phone: string, fullName?: string) => Promise<void>;
  verifyOtp: (code: string, fullName?: string) => Promise<void>;
  loginWithEmail: (data: LoginEmailInput) => Promise<void>;
  loginWithGoogle: (data: { idToken: string }) => Promise<void>;
  register: (
    data: RegisterInput,
    verifier?: ApplicationVerifier,
  ) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearError: () => void;
}

// ================================================================================== //
// Helpers
// ================================================================================== //

async function saveTokens(tokens: AuthResult["tokens"]) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, tokens.accessToken),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, tokens.refreshToken),
  ]);
}

async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
  ]);
}

async function handleAuthResult(
  result: AuthResult,
  set: (s: Partial<AuthState>) => void,
) {
  await saveTokens(result.tokens);
  set({
    user: result.user,
    accessToken: result.tokens.accessToken,
    error: null,
  });
}

// ================================================================================== //
// Store
// ================================================================================== //

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      isHydrated: false,

      hydrate: async () => {
        try {
          const token = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);

          if (!token) {
            set({ isHydrated: true });
            return;
          }

          // Token + cached user from persist → unblock UI immediately
          if (get().user && get().accessToken === token) {
            set({ isHydrated: true });
            try {
              const res = await apiClient.get<UserProfile>("/users/patients/profile");
              if (res.success && res.data) {
                set({ user: res.data });
              }
            } catch {
              // Silently fail – cached data is sufficient
            }
            return;
          }

          // Token but no cached user → set token, unblock UI, fetch profile
          set({ accessToken: token, isHydrated: true });
          try {
            const res = await apiClient.get<UserProfile>("/users/patients/profile");
            if (res.success && res.data) {
              set({ user: res.data });
            } else {
              await clearTokens();
              set({ user: null, accessToken: null });
            }
          } catch {
            await clearTokens();
            set({ user: null, accessToken: null });
          }
        } catch {
          await clearTokens();
          set({ user: null, accessToken: null });
          set({ isHydrated: true });
        }
      },

      /**
       * Send OTP for phone login/registration
       */
      sendOtp: async (phone: string, fullName?: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.sendOtp(phone);
          router.push({
            pathname: "/(auth)/otp",
            params: { phone, fullName: fullName || "" },
          });
        } catch (e: any) {
          set({ error: e?.message ?? i18next.t("errors.generic") });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Verify OTP for phone login/registration
       */
      verifyOtp: async (code: string, fullName?: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.verifyOtp(code, fullName);
          await handleAuthResult(result, set);
          router.replace("/(main)");
        } catch (e: any) {
          set({ error: e?.message ?? i18next.t("auth.otp.invalidCode") });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Login with email and password (Firebase + Backend)
       */
      loginWithEmail: async (data) => {
        set({ isLoading: true, error: null });
        try {
          // Firebase sign in with email/password
          const result = await authService.loginWithEmail(data);
          await handleAuthResult(result, set);
          router.replace("/(main)");
        } catch (e: any) {
          let message = i18next.t("errors.generic");
          if (e.code === "auth/user-not-found") {
            message = i18next.t("errors.notFound");
          } else if (e.code === "auth/wrong-password") {
            message = i18next.t("errors.generic");
          } else if (e.code === "auth/invalid-email") {
            message = i18next.t("validation.emailInvalid");
          } else if (e.code === "auth/user-disabled") {
            message = i18next.t("errors.unauthorized");
          } else if (e.code === "auth/too-many-requests") {
            message = i18next.t("errors.tryAgain");
          }
          set({ error: e?.message || message });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Login with Google (Firebase + Backend)
       */
      loginWithGoogle: async ({ idToken }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.loginWithGoogle(idToken);
          await handleAuthResult(response, set);
          router.replace("/(main)");
        } catch (e: any) {
          set({ error: e?.message ?? i18next.t("errors.generic") });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Register new user (Email or Phone)
       */
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          if (data.mode === "phone") {
            await get().sendOtp(data.phone!, data.fullName);
            console.log("API Register data : ", data);
            return;
          }

          const result = await authService.register(data);
          console.log("API Register result : ", result);
          if (result && !("requiresOtp" in result)) {
            await handleAuthResult(result, set);
            router.replace("/(auth)/onboarding/location");
          }
        } catch (e: any) {
          let message = i18next.t("errors.generic");
          if (e.code === "auth/email-already-in-use") {
            message = i18next.t("errors.generic");
          } else if (e.code === "auth/invalid-email") {
            message = i18next.t("validation.emailInvalid");
          } else if (e.code === "auth/argument-error") {
            message = i18next.t("validation.passwordMin");
          } else if (e.code === "auth/weak-password") {
            message = i18next.t("validation.passwordMin");
          } else if (e.code === "auth/user-disabled") {
            message = i18next.t("errors.unauthorized");
          } else if (e.code === "auth/too-many-requests") {
            message = i18next.t("errors.tryAgain");
          }
          set({ error: e?.message || message });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Send password reset email (Firebase)
       */
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          // ✅ Firebase password reset
          await authService.forgotPassword(email);
        } catch (e: any) {
          let message = i18next.t("errors.generic");
          if (e.code === "auth/user-not-found") {
            message = i18next.t("errors.notFound");
          } else if (e.code === "auth/invalid-email") {
            message = i18next.t("validation.emailInvalid");
          }
          set({ error: e?.message || message });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Verify password reset OTP
       */
      verifyPasswordResetOtp: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.verifyPasswordResetOtp(email, otp);
        } catch (e: any) {
          set({ error: e?.message ?? i18next.t("auth.otp.invalidCode") });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Reset password after OTP verification
       */
      resetPassword: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(email, password);
        } catch (e: any) {
          set({
            error:
              e?.message ??
              i18next.t("errors.generic"),
          });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Logout user (Clear Firebase + Backend + Local)
       */
      logout: async () => {
        set({ isLoading: true });
        try {
          await signOut(auth);
          await authService.logout();
        } catch {
          // Continue with local cleanup even if API fails
        } finally {
          await clearTokens();
          set({ user: null, accessToken: null, isLoading: false, error: null });
          router.replace("/(auth)");
        }
      },

      setError: (error) => set({ error }),

      setLoading: (isLoading) => set({ isLoading }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "vitacare-auth-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => () => {},
    },
  ),
);

// ================================================================================== //
// API Client Logout Handler
// ================================================================================== //

apiClient.setLogoutHandler(() => {
  useAuthStore.getState().logout();
});
