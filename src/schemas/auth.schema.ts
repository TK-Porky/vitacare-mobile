import { z } from 'zod';

// Regex for Cameroon phone numbers (9 digits)
const phoneRegex = /^[6](2|5|6|7|8|9)[0-9]{7}$/;

// ================================================================================== //
// Login
// ================================================================================== //

// Login with email
export const loginEmailSchema = z.object({
  email: z.string().min(1, 'L\'adresse email est requise').email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  rememberMe: z.boolean().optional(),
});

// Type for login email form
export type LoginEmailInput = z.infer<typeof loginEmailSchema>;

// Login with phone
export const loginPhoneSchema = z.object({
  phone: z.string().min(1, 'Le numéro de téléphone est requis').regex(phoneRegex, 'Numéro de téléphone invalide'),
});

export type LoginPhoneInput = z.infer<typeof loginPhoneSchema>;

// ================================================================================== //
// Registration
// ================================================================================== //

// Schema for registration
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet est requis (min 2 caractères)'),
  mode: z.enum(['phone', 'email']),
  phone: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate phone or email based on mode
  if (data.mode === 'phone') {
    if (!data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le numéro de téléphone est requis',
        path: ['phone'],
      });
    } else if (!phoneRegex.test(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Numéro de téléphone invalide',
        path: ['phone'],
      });
    }
  } else if (data.mode === 'email') {
    // Validate email mode
    if (!data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'L\'adresse email est requise',
        path: ['email'],
      });
    } else if (!z.string().email().safeParse(data.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Adresse email invalide',
        path: ['email'],
      });
    }
    // Validate password
    if (!data.password || data.password.length < 8 || data.password.includes(' ')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum 8 caractères, sans espace',
        path: ['password'],
      });
    }

    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
      });
    }
  }
});

// Export type
export type RegisterInput = z.infer<typeof registerSchema>;

// ================================================================================== //
// Forgot Password
// ================================================================================== //

// Export schema for email-based forgot password
export const forgotPasswordEmailSchema = z.object({
  email: z.string().min(1, 'L\'adresse email est requise').email('Adresse email invalide'),
});

// Export type for email-based forgot password
export type ForgotPasswordEmailInput = z.infer<typeof forgotPasswordEmailSchema>;

// ================================================================================== //
// OTP Verification
// ================================================================================== //

// Export schema for OTP verification
export const forgotPasswordOtpSchema = z.object({
  otp: z.string().length(6, 'Le code doit contenir 6 chiffres'),
});

export type ForgotPasswordOtpInput = z.infer<typeof forgotPasswordOtpSchema>;

// ================================================================================== //
// Password Reset
// ================================================================================== //

// Export schema for password reset
export const forgotPasswordResetSchema = z.object({
  password: z.string().min(8, 'Minimum 8 caractères, sans espace').refine(s => !s.includes(' '), 'Sans espace'),
  confirmPassword: z.string().min(1, 'La confirmation est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export type ForgotPasswordResetInput = z.infer<typeof forgotPasswordResetSchema>;

// ================================================================================== //
// OTP Verification
// ================================================================================== //

// Export schema for OTP verification
export const otpSchema = z.object({
  phone: z.string().regex(/^[6](2|5|6|7|8|9)[0-9]{7}$/, 'Numéro invalide'),
  code: z.string().length(6, 'Le code doit contenir 6 chiffres'),
});

export type OtpInput = z.infer<typeof otpSchema>;

// ================================================================================== //
// Onboarding
// ================================================================================== //

// Export schema for location search
export const onboardingLocationSchema = z.object({
  searchQuery: z.string().min(1, 'Veuillez indiquer votre position'),
});

export type OnboardingLocationInput = z.infer<typeof onboardingLocationSchema>;

// Export schema for search reason selection
export const onboardingSearchSchema = z.object({
  reason: z.string().min(1, 'Veuillez sélectionner une option'),
});

export type OnboardingSearchInput = z.infer<typeof onboardingSearchSchema>;

// Export schema for language selection
export const onboardingLanguageSchema = z.object({
  language: z.string().min(1, 'Veuillez sélectionner une langue'),
});

export type OnboardingLanguageInput = z.infer<typeof onboardingLanguageSchema>;
