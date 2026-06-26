import { useMutation } from '@tanstack/react-query';
import { useProfileStore } from '../store/profile.store';
import { UpdateProfileInput, ChangePasswordInput, UpdatePreferencesInput } from '../schemas/profile.schema';

/**
 * Custom hook for profile-related operations
 * 
 * Provides mutations for updating profile, changing password, 
 * updating preferences and uploading avatar.
 */
export const useProfile = () => {
  const store = useProfileStore();

  /**
   * Update profile mutation
   */
  const updateProfileMutation = useMutation({
    mutationFn: (values: UpdateProfileInput) => store.updateProfile(values),
  });

  /**
   * Change password mutation
   */
  const changePasswordMutation = useMutation({
    mutationFn: (values: ChangePasswordInput) => store.changePassword(values),
  });

  /**
   * Update preferences mutation
   */
  const updatePreferencesMutation = useMutation({
    mutationFn: (values: UpdatePreferencesInput) => store.updatePreferences(values),
  });

  /**
   * Upload avatar mutation
   */
  const uploadAvatarMutation = useMutation({
    mutationFn: ({ fileUri, fileName, fileType }: { fileUri: string; fileName: string; fileType: string }) => 
      store.uploadAvatar(fileUri, fileName, fileType),
  });

  return {
    // Actions
    updateProfile:          updateProfileMutation.mutateAsync,
    isUpdatingProfile:      updateProfileMutation.isPending,
    updateProfileError:     updateProfileMutation.error,

    changePassword:         changePasswordMutation.mutateAsync,
    isChangingPassword:     changePasswordMutation.isPending,
    changePasswordError:    changePasswordMutation.error,

    updatePreferences:      updatePreferencesMutation.mutateAsync,
    isUpdatingPreferences:  updatePreferencesMutation.isPending,

    uploadAvatar:           uploadAvatarMutation.mutateAsync,
    isUploadingAvatar:      uploadAvatarMutation.isPending,

    // Store states
    isLoading:              store.isLoading,
    error:                  store.error,
    success:                store.success,
    clearState:             store.clearState,
  };
};
