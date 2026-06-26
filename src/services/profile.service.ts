import { apiClient } from "../lib/api.client";
import { API_ENDPOINTS } from "../types/api-endpoints";
import { 
  UpdateProfileRequest, 
  UpdatePreferencesRequest,
  DeleteAccountRequest,
  ChangePasswordRequest,
  UpdateNotificationPreferencesRequest,
} from "../types/api-requests";
import { UserProfileResponse } from "../types/api-responses";

/**
 * Profile Service Error Class
 * Custom error for better error handling
 */
export class ProfileServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ProfileServiceError';
  }
}

/**
 * Profile Service
 * Handles all user profile and preference-related API calls.
 */
export const profileService = {
  /**
   * Get current user profile
   * @throws {ProfileServiceError} If the request fails
   */
  async getProfile(): Promise<UserProfileResponse> {
    try {
      const res = await apiClient.get<UserProfileResponse>(API_ENDPOINTS.USERS.PROFILE);
      if (!res.success) {
        throw new ProfileServiceError(
          res.error ?? "Failed to fetch profile",
          res.statusCode
        );
      }
      return res.data!;
    } catch (error) {
      if (error instanceof ProfileServiceError) throw error;
      throw new ProfileServiceError(
        "An unexpected error occurred while fetching profile",
        undefined,
        error
      );
    }
  },

  /**
   * Update user profile data
   * @throws {ProfileServiceError} If the request fails
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfileResponse> {
    try {
      if (data.fullName && data.fullName.length < 2) {
        throw new ProfileServiceError("Full name must be at least 2 characters");
      }

      const res = await apiClient.patch<UserProfileResponse>(
        API_ENDPOINTS.USERS.UPDATE_PROFILE,
        data
      );
      
      if (!res.success) {
        throw new ProfileServiceError(
          res.error ?? "Failed to update profile",
          res.statusCode
        );
      }
      return res.data!;
    } catch (error) {
      if (error instanceof ProfileServiceError) throw error;
      throw new ProfileServiceError(
        "An unexpected error occurred while updating profile",
        undefined,
        error
      );
    }
  },

  /**
   * Change user password
   * @throws {ProfileServiceError} If the request fails
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      // Validation
      if (!data.currentPassword || data.currentPassword.length < 6) {
        throw new ProfileServiceError("Current password is required");
      }
      if (!data.newPassword || data.newPassword.length < 6) {
        throw new ProfileServiceError("New password must be at least 6 characters");
      }

      const res = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
      if (!res.success) {
        throw new ProfileServiceError(
          res.error ?? "Failed to change password",
          res.statusCode
        );
      }
    } catch (error) {
      if (error instanceof ProfileServiceError) throw error;
      throw new ProfileServiceError(
        "An unexpected error occurred while changing password",
        undefined,
        error
      );
    }
  },

  /**
   * Update user preferences
   * @throws {ProfileServiceError} If the request fails
   */
  async updatePreferences(data: UpdatePreferencesRequest): Promise<void> {
    try {
      const res = await apiClient.put(
        API_ENDPOINTS.USERS.UPDATE_PREFERENCES,
        data
      );
      if (!res.success) {
        throw new ProfileServiceError(
          res.error ?? "Failed to update preferences",
          res.statusCode
        );
      }
    } catch (error) {
      if (error instanceof ProfileServiceError) throw error;
      throw new ProfileServiceError(
        "An unexpected error occurred while updating preferences",
        undefined,
        error
      );
    }
  },

  /**
   * Update notification preferences
   * @throws {ProfileServiceError} If the request fails
   */
  async updateNotificationPreferences(
    data: UpdateNotificationPreferencesRequest
  ): Promise<void> {
    try {
      const res = await apiClient.put(
        API_ENDPOINTS.NOTIFICATIONS.UPDATE_PREFERENCES,
        data
      );
      if (!res.success) {
        throw new ProfileServiceError(
          res.error ?? "Failed to update notification preferences",
          res.statusCode
        );
      }
    } catch (error) {
      if (error instanceof ProfileServiceError) throw error;
      throw new ProfileServiceError(
        "An unexpected error occurred while updating notification preferences",
        undefined,
        error
      );
    }
  },

  /**
   * Upload user avatar
   * @param fileUri - Local URI of the image file
   * @param fileName - Name of the file (e.g., "avatar.jpg")
   * @param fileType - MIME type (e.g., "image/jpeg")
   * @returns The URL of the uploaded avatar
   * @throws {ProfileServiceError} If the upload fails
   */
  async uploadAvatar(
    fileUri: string,
    fileName: string,
    fileType: string
  ): Promise<{ avatarUrl: string }> {
    try {
      // Validation des fichiers
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(fileType)) {
        throw new ProfileServiceError(
          `Invalid file type. Supported types: ${validTypes.join(', ')}`
        );
      }

      // Vérifier la taille du fichier (optionnel - à adapter selon vos besoins)
      // Note: La taille sera vérifiée côté serveur, mais on peut ajouter une validation client

      const res = await apiClient.upload<{ avatarUrl: string }>(
        API_ENDPOINTS.USERS.AVATAR,
        fileUri,
        fileName,
        fileType,
        'avatar' // Must match @RequestParam("avatar") on the backend
      );

      console.log('[ProfileService] Avatar upload response:', JSON.stringify(res));

      if (!res.success) {
        throw new ProfileServiceError(
          res.error ?? "Failed to upload avatar",
          res.statusCode
        );
      }

      // The backend returns { success, message, data: { avatarUrl } }
      // The apiClient unwraps .data from the response body
      const avatarUrl = res.data?.avatarUrl;
      console.log('[ProfileService] Avatar URL received:', avatarUrl);

      if (!avatarUrl) {
        console.warn('[ProfileService] No avatarUrl in response, raw data:', res.data);
      }

      return { avatarUrl: avatarUrl || '' };
    } catch (error) {
      if (error instanceof ProfileServiceError) throw error;
      throw new ProfileServiceError(
        "An unexpected error occurred while uploading avatar",
        undefined,
        error
      );
    }
  },

  /**
   * Delete user account
   * @throws {ProfileServiceError} If the request fails
   */
  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    try {
      if (!data.password) {
        throw new ProfileServiceError("Password is required to delete account");
      }
      if (data.confirmDeletion !== true) {
        throw new ProfileServiceError("Please confirm account deletion");
      }

      const res = await apiClient.delete(API_ENDPOINTS.USERS.DELETE_ACCOUNT, data);
      if (!res.success) {
        throw new ProfileServiceError(
          res.error ?? "Failed to delete account",
          res.statusCode
        );
      }
    } catch (error) {
      if (error instanceof ProfileServiceError) throw error;
      throw new ProfileServiceError(
        "An unexpected error occurred while deleting account",
        undefined,
        error
      );
    }
  },

  /**
   * Get user profile by ID (admin or specific user)
   * @throws {ProfileServiceError} If the request fails
   */
  async getUserProfileById(userId: string): Promise<UserProfileResponse> {
    try {
      if (!userId) {
        throw new ProfileServiceError("User ID is required");
      }

      const endpoint = API_ENDPOINTS.USERS.PROFILE.replace(':id', userId);
      const res = await apiClient.get<UserProfileResponse>(endpoint);
      
      if (!res.success) {
        throw new ProfileServiceError(
          res.error ?? `Failed to fetch profile for user ${userId}`,
          res.statusCode
        );
      }
      return res.data!;
    } catch (error) {
      if (error instanceof ProfileServiceError) throw error;
      throw new ProfileServiceError(
        "An unexpected error occurred while fetching user profile",
        undefined,
        error
      );
    }
  },

  /**
   * Upload avatar with progress tracking
   * @param fileUri - Local URI of the image file
   * @param fileName - Name of the file
   * @param fileType - MIME type
   * @param onProgress - Callback for upload progress (0-1)
   * @returns The URL of the uploaded avatar
   * @throws {ProfileServiceError} If the upload fails
   */
  async uploadAvatarWithProgress(
    fileUri: string,
    fileName: string,
    fileType: string,
    onProgress?: (progress: number) => void
  ): Promise<{ avatarUrl: string }> {
    try {
      // Validation des fichiers
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(fileType)) {
        throw new ProfileServiceError(
          `Invalid file type. Supported types: ${validTypes.join(', ')}`
        );
      }

      // Note: Pour le suivi de progression, vous devrez implémenter une solution
      // avec XMLHttpRequest ou une bibliothèque comme react-native-fs
      // Cette méthode est un placeholder qui appelle la méthode standard
      // jusqu'à ce que expo/fetch supporte les upload progress

      console.log('[ProfileService] Starting avatar upload with progress tracking');
      if (onProgress) {
        onProgress(0.5); // Simuler une progression
      }

      const result = await this.uploadAvatar(fileUri, fileName, fileType);

      if (onProgress) {
        onProgress(1);
      }

      return result;
    } catch (error) {
      if (error instanceof ProfileServiceError) throw error;
      throw new ProfileServiceError(
        "An unexpected error occurred while uploading avatar with progress",
        undefined,
        error
      );
    }
  }
};

// Export du service avec typage
export type ProfileService = typeof profileService;