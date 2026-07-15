import { create } from "zustand";
import { profileService } from "../services/profile.service";
import {
  UpdateProfileInput,
  ChangePasswordInput,
  UpdatePreferencesInput,
} from "../schemas/profile.schema";
import { useAuthStore } from "./auth.store";
import { UserProfileResponse } from "@/types/api-responses";
import i18next from "@/i18n";

interface ProfileState {
  isLoading: boolean;
  error: string | null;
  success: boolean;

  getProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<UserProfileResponse>;
  changePassword: (data: ChangePasswordInput) => Promise<void>;
  updatePreferences: (data: UpdatePreferencesInput) => Promise<void>;
  uploadAvatar: (
    fileUri: string,
    fileName: string,
    fileType: string,
  ) => Promise<void>;
  clearState: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  isLoading: false,
  error: null,
  success: false,

  getProfile: async () => {
    set({ isLoading: true, error: null, success: false });
    try {
      await profileService.getProfile();

      useAuthStore.getState().hydrate();

      set({ success: true });
    } catch (e: any) {
      set({ error: e?.message ?? i18next.t("errors.generic") });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null, success: false });
    try {
      const res = await profileService.updateProfile({
        fullName: data.fullName,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        bloodGroup: data.bloodGroup,
        medicalHistory: data.medicalHistory,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      if (res.statusCode !== 0) {
        set({ error: res.message, success: false });
        return res;
      }

      await useAuthStore.getState().hydrate();

      set({ success: true });
      return res;
    } catch (e: any) {
      set({ error: e?.message ?? i18next.t("profile.editScreen.error") });
      throw new Error(e?.message ?? i18next.t("profile.editScreen.error"));
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (data) => {
    set({ isLoading: true, error: null, success: false });
    try {
      await profileService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      set({ success: true });
    } catch (e: any) {
      set({
        error: e?.message ?? i18next.t("profile.changePasswordScreen.error"),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updatePreferences: async (data) => {
    set({ isLoading: true, error: null, success: false });
    try {
      if (data.language) {
        await profileService.updatePreferences({
          language: data.language,
        });
      }

      if (
        data.notifications !== undefined ||
        data.medicationReminders !== undefined ||
        data.appointmentReminders !== undefined ||
        data.promotions !== undefined
      ) {
        await profileService.updateNotificationPreferences({
          push: data.notifications,
          medicationReminders: data.medicationReminders,
          appointmentReminders: data.appointmentReminders,
          promotions: data.promotions,
        });
      }

      set({ success: true });
    } catch (e: any) {
      set({
        error: e?.message ?? i18next.t("errors.generic"),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadAvatar: async (fileUri, fileName, fileType) => {
    set({ isLoading: true, error: null, success: false });
    try {
      const result = await profileService.uploadAvatar(
        fileUri,
        fileName,
        fileType,
      );
      console.log(
        "[ProfileStore] Avatar upload result:",
        JSON.stringify(result),
      );

      const authState = useAuthStore.getState();
      if (authState.user && result.avatarUrl) {
        useAuthStore.setState({
          user: { ...authState.user, avatarUrl: result.avatarUrl },
        });
        console.log(
          "[ProfileStore] Auth store user avatarUrl updated to:",
          result.avatarUrl,
        );
      }

      try {
        await authState.hydrate();
      } catch (hydrateError) {
        console.warn(
          "[ProfileStore] Hydrate after avatar upload failed (non-critical):",
          hydrateError,
        );
      }

      set({ success: true });
    } catch (e: any) {
      console.error("[ProfileStore] Avatar upload error:", e);
      set({ error: e?.message ?? i18next.t("profile.editScreen.saveErrorMessage") });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  clearState: () => set({ error: null, success: false, isLoading: false }),
}));
