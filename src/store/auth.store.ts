import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ApplicationVerifier } from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import { authService, type AuthResult, type UserProfile } from "../services/auth.service";
import { apiClient } from "../lib/api.client";
import type { LoginEmailInput, RegisterInput } from "../schemas/auth.schema";
import { router } from "expo-router";

// ================================================================================== //
// Constants
// ================================================================================== //

const KEYS = {
  ACCESS_TOKEN:  "vitacare_access_token",
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
  user:          UserProfile | null;
  accessToken:   string | null;
  isLoading:     boolean;
  error:         string | null;
  isHydrated:    boolean;

  // Actions
  hydrate:          () => Promise<void>;
  sendOtp:          (phone: string, fullName?: string) => Promise<void>;
  verifyOtp:        (code: string, fullName?: string) => Promise<void>;
  loginWithEmail:   (data: LoginEmailInput) => Promise<void>;
  register:         (data: RegisterInput, verifier?: ApplicationVerifier) => Promise<void>;
  forgotPassword:   (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, otp: string) => Promise<void>;
  resetPassword:    (email: string, password: string) => Promise<void>;
  logout:           () => Promise<void>;
  clearError:       () => void;
}

// ================================================================================== //
// Helpers
// ================================================================================== //

async function saveTokens(tokens: AuthResult["tokens"]) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN,  tokens.accessToken),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, tokens.refreshToken),
  ]);
}

async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
  ]);
}

async function handleAuthResult(result: AuthResult, set: (s: Partial<AuthState>) => void) {
  await saveTokens(result.tokens);
  set({ user: result.user, accessToken: result.tokens.accessToken, error: null });
}

// ================================================================================== //
// Store
// ================================================================================== //

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,
      isLoading:   false,
      error:       null,
      isHydrated:  false,

      hydrate: async () => {
        try {
          const token = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
          if (token) {
            // Check if user is already in state from persist
            if (get().user && get().accessToken === token) {
              const res = await apiClient.get<UserProfile>('/users/patients/profile');
              console.log(res.data);
              set({ user: res.data, isHydrated: true });
              return;
            }

            const res = await apiClient.get<UserProfile>('/users/patients/profile');

            if (res.success && res.data) {
              set({ accessToken: token, user: res.data });
            } else {
              await clearTokens();
              set({ user: null, accessToken: null });
            }
          }
        } catch {
          await clearTokens();
          set({ user: null, accessToken: null });
        } finally {
          set({ isHydrated: true });
        }
      },

      sendOtp: async (phone: string, fullName?: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.sendOtp(phone);
          router.push({ 
            pathname: "/(auth)/otp", 
            params: { phone, fullName: fullName || "" } 
          });
        } catch (e: any) {
          set({ error: e?.message ?? "Erreur lors de l'envoi du SMS." });
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (code: string, fullName?: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.verifyOtp(code, fullName);
          await handleAuthResult(result, set);
          router.replace("/(main)");
        } catch (e: any) {
          set({ error: e?.message ?? "Code invalide ou expiré." });
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithEmail: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.loginWithEmail(data);
          await handleAuthResult(result, set);
          router.replace("/(main)");
        } catch (e: any) {
          set({ error: e?.message ?? "Email ou mot de passe incorrect." });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          if (data.mode === 'phone') {
            await get().sendOtp(data.phone!, data.fullName);
            return;
          }

          const result = await authService.register(data);
          if (result && !('requiresOtp' in result)) {
            await handleAuthResult(result, set);
            router.replace('/(auth)/onboarding-location');
          }
        } catch (e: any) {
          set({ error: e?.message ?? "Erreur lors de l'inscription." });
        } finally {
          set({ isLoading: false });
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await authService.forgotPassword(email);
        } catch (e: any) {
          set({ error: e?.message ?? "Impossible d'envoyer l'email." });
        } finally {
          set({ isLoading: false });
        }
      },

      verifyPasswordResetOtp: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.verifyPasswordResetOtp(email, otp);
        } catch (e: any) {
          set({ error: e?.message ?? "Code invalide ou expiré." });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(email, password);
        } catch (e: any) {
          set({ error: e?.message ?? "Erreur lors de la réinitialisation du mot de passe." });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch {}
        await clearTokens();
        set({ user: null, accessToken: null, isLoading: false, error: null });
        router.replace("/(auth)");
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "vitacare-auth-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrate();
      },
    }
  )
);

apiClient.setLogoutHandler(() => {
  useAuthStore.getState().logout();
});
