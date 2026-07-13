import { z } from 'zod';
import type { TFunction } from "i18next";

const phoneRegex = /^[6](2|5|6|7|8|9)[0-9]{7}$/;

export const getLoginEmailSchema = (t: TFunction) =>
  z.object({
    email: z.string().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
    password: z.string().min(8, t('validation.passwordMin')),
    rememberMe: z.boolean().optional(),
  });

export type LoginEmailInput = z.infer<ReturnType<typeof getLoginEmailSchema>>;

export const getLoginPhoneSchema = (t: TFunction) =>
  z.object({
    phone: z.string().min(1, t('validation.phoneRequired')).regex(phoneRegex, t('validation.phoneInvalid')),
  });

export type LoginPhoneInput = z.infer<ReturnType<typeof getLoginPhoneSchema>>;

export const getRegisterSchema = (t: TFunction) =>
  z.object({
    fullName: z.string().min(2, t('validation.fullNameRequired')),
    mode: z.enum(['phone', 'email']),
    phone: z.string().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.mode === 'phone') {
      if (!data.phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.phoneRequired'),
          path: ['phone'],
        });
      } else if (!phoneRegex.test(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.phoneInvalid'),
          path: ['phone'],
        });
      }
    } else if (data.mode === 'email') {
      if (!data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.emailRequired'),
          path: ['email'],
        });
      } else if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.emailInvalid'),
          path: ['email'],
        });
      }
      if (!data.password || data.password.length < 8 || data.password.includes(' ')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.passwordMin'),
          path: ['password'],
        });
      }
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.passwordMismatch'),
          path: ['confirmPassword'],
        });
      }
    }
  });

export type RegisterInput = z.infer<ReturnType<typeof getRegisterSchema>>;

export const getForgotPasswordEmailSchema = (t: TFunction) =>
  z.object({
    email: z.string().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
  });

export type ForgotPasswordEmailInput = z.infer<ReturnType<typeof getForgotPasswordEmailSchema>>;

export const getForgotPasswordOtpSchema = (t: TFunction) =>
  z.object({
    otp: z.string().length(6, t('validation.required')),
  });

export type ForgotPasswordOtpInput = z.infer<ReturnType<typeof getForgotPasswordOtpSchema>>;

export const getForgotPasswordResetSchema = (t: TFunction) =>
  z.object({
    password: z.string().min(8, t('validation.passwordMin')).refine(s => !s.includes(' '), t('validation.passwordSpace')),
    confirmPassword: z.string().min(1, t('validation.confirmPasswordRequired')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordMismatch'),
    path: ["confirmPassword"],
  });

export type ForgotPasswordResetInput = z.infer<ReturnType<typeof getForgotPasswordResetSchema>>;

export const getOtpSchema = (t: TFunction) =>
  z.object({
    phone: z.string().regex(/^[6](2|5|6|7|8|9)[0-9]{7}$/, t('validation.phoneInvalid')),
    code: z.string().length(6, t('validation.required')),
  });

export type OtpInput = z.infer<ReturnType<typeof getOtpSchema>>;

export const getOnboardingLocationSchema = (t: TFunction) =>
  z.object({
    searchQuery: z.string().min(1, t('validation.required')),
  });

export type OnboardingLocationInput = z.infer<ReturnType<typeof getOnboardingLocationSchema>>;

export const getOnboardingSearchSchema = (t: TFunction) =>
  z.object({
    reason: z.string().min(1, t('validation.required')),
  });

export type OnboardingSearchInput = z.infer<ReturnType<typeof getOnboardingSearchSchema>>;

export const getOnboardingLanguageSchema = (t: TFunction) =>
  z.object({
    language: z.string().min(1, t('validation.required')),
  });

export type OnboardingLanguageInput = z.infer<ReturnType<typeof getOnboardingLanguageSchema>>;
