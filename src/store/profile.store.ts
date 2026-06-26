import { create } from "zustand";
import { profileService } from "../services/profile.service";
import { UpdateProfileInput, ChangePasswordInput, UpdatePreferencesInput, UpdateLocationInput } from "../schemas/profile.schema";
import { useAuthStore } from "./auth.store";

interface ProfileState {
  isLoading: boolean;
  error: string | null;
  success: boolean;

  // Actions
  getProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  changePassword: (data: ChangePasswordInput) => Promise<void>;
  updatePreferences: (data: UpdatePreferencesInput) => Promise<void>;
  uploadAvatar: (fileUri: string, fileName: string, fileType: string) => Promise<void>;
  clearState: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  isLoading: false,
  error: null,
  success: false,

  /**
   * 
   * @param data 
   */
  getProfile: async() => {
    set({ isLoading: true, error: null, success: false});
    try {
      await profileService.getProfile();

      useAuthStore.getState().hydrate();

      set({ success: true});
    } catch (e: any) {
      set({ error: e?.message ?? "Erreur lors de la récupération du profil."});
    } finally {
      set({ isLoading: false})
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data) => {
    set({ isLoading: true, error: null, success: false });
    try {

      await profileService.updateProfile({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        bloodGroup: data.bloodGroup,
        medicalHistory: data.medicalHistory,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // Update auth store user data
      useAuthStore.getState().hydrate(); // Or manually set if hydrate is too heavy
      
      set({ success: true });
    } catch (e: any) {
      set({ error: e?.message ?? "Erreur lors de la mise à jour du profil." });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Change user password
   */
  changePassword: async (data) => {
    set({ isLoading: true, error: null, success: false });
    try {
      await profileService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      set({ success: true });
    } catch (e: any) {
      set({ error: e?.message ?? "Erreur lors du changement de mot de passe." });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Update user preferences
   */
  updatePreferences: async (data) => {
    set({ isLoading: true, error: null, success: false });
    try {
      if (data.language) {
        await profileService.updatePreferences({
          language: data.language,
        });
      }
      
      if (data.notifications !== undefined || 
          data.medicationReminders !== undefined || 
          data.appointmentReminders !== undefined || 
          data.promotions !== undefined) {
        await profileService.updateNotificationPreferences({
          push: data.notifications,
          medicationReminders: data.medicationReminders,
          appointmentReminders: data.appointmentReminders,
          promotions: data.promotions,
        });
      }

      set({ success: true });
    } catch (e: any) {
      set({ error: e?.message ?? "Erreur lors de la mise à jour des préférences." });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Upload user avatar
   */
  uploadAvatar: async (fileUri, fileName, fileType) => {
    set({ isLoading: true, error: null, success: false });
    try {
      const result = await profileService.uploadAvatar(fileUri, fileName, fileType);
      console.log('[ProfileStore] Avatar upload result:', JSON.stringify(result));
      
      // Immediately update the auth store user with the new avatar URL
      const authState = useAuthStore.getState();
      if (authState.user && result.avatarUrl) {
        useAuthStore.setState({
          user: { ...authState.user, avatarUrl: result.avatarUrl },
        });
        console.log('[ProfileStore] Auth store user avatarUrl updated to:', result.avatarUrl);
      }
      
      // Also re-fetch the full profile from backend to ensure consistency
      try {
        await authState.hydrate();
      } catch (hydrateError) {
        console.warn('[ProfileStore] Hydrate after avatar upload failed (non-critical):', hydrateError);
      }
      
      set({ success: true });
    } catch (e: any) {
      console.error('[ProfileStore] Avatar upload error:', e);
      set({ error: e?.message ?? "Erreur lors de l'envoi de l'avatar." });
      throw e; // Re-throw so the UI can handle it
    } finally {
      set({ isLoading: false });
    }
  },

  clearState: () => set({ error: null, success: false, isLoading: false }),
}));
