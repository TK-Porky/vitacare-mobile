/**
 * Auth hooks for authentication operations
 * 
 * @remarks
 * This hook provides authentication operations including login, registration, and forgot password.
 * It uses TanStack Query for state management and React Query for data fetching.
 */

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import type { LoginEmailInput, OtpInput, RegisterInput } from '../schemas/auth.schema';

export const useAuth = () => {
  const store = useAuthStore();

  /**
   * Login with email mutation
   */
  const loginEmailMutation = useMutation({
    mutationFn: (values: LoginEmailInput) => store.loginWithEmail(values),
  });

  /**
   * Send OTP mutation
   */
  const loginPhoneMutation = useMutation({
    mutationFn: ({ phone }: { phone: string }) => 
      store.sendOtp(phone),
  });

  /**
   * Verify OTP mutation
   */
  const verifyOtpMutation = useMutation({
    mutationFn: (values: OtpInput & { fullName?: string }) => 
      store.verifyOtp(values.code, values.fullName),
  });

  /**
   * Register mutation
   */
  const registerMutation = useMutation({
    mutationFn: ({ data, verifier }: { data: RegisterInput; verifier?: any }) => 
      store.register(data, verifier),
  });

  /**
   * Forgot password mutation
   */
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => store.forgotPassword(email),
  });

  /**
   * Verify password reset OTP mutation
   */
  const verifyPasswordResetOtpMutation = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => 
      store.verifyPasswordResetOtp(email, otp),
  });

  /**
   * Reset password mutation
   */
  const resetPasswordMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      store.resetPassword(email, password),
  });

  return {
    loginEmail:          loginEmailMutation.mutate,
    isLoggingInEmail:    loginEmailMutation.isPending,
    loginEmailError:     loginEmailMutation.error,

    loginPhone:          loginPhoneMutation.mutate,
    isLoggingInPhone:    loginPhoneMutation.isPending,

    verifyOtp:           verifyOtpMutation.mutate,
    isVerifyingOtp:      verifyOtpMutation.isPending,

    register:            registerMutation.mutate,
    isRegistering:       registerMutation.isPending,

    forgotPassword:           forgotPasswordMutation.mutateAsync,
    isSendingReset:           forgotPasswordMutation.isPending,
    
    verifyPasswordResetOtp:   verifyPasswordResetOtpMutation.mutateAsync,
    isVerifyingResetOtp:      verifyPasswordResetOtpMutation.isPending,

    resetPassword:            resetPasswordMutation.mutateAsync,
    isResettingPassword:      resetPasswordMutation.isPending,

    logout:              store.logout,
  };
};