import { z } from 'zod';

// Regex for Cameroon phone numbers (9 digits)
const phoneRegex = /^[6](2|5|6|7|8|9)[0-9]{7}$/;

// ================================================================================== //
// Profile Update
// ================================================================================== //

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet est requis (min 2 caractères)'),
  email: z.string().min(1, 'L\'adresse email est requise').email('Adresse email invalide'),
  phoneNumber: z.string().optional().refine((val) => val === undefined || val === null || phoneRegex.test(val as string), 'Numéro de téléphone invalide'),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  medicalHistory: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ================================================================================== //
// Location Update
// ================================================================================== //

export const updateLocationSchema = z.object({
  location: z.string().min(1, 'La localisation est requise'),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

// ================================================================================== //
// Change Password
// ================================================================================== //

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'L\'ancien mot de passe est requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères').refine(s => !s.includes(' '), 'Sans espace'),
  confirmPassword: z.string().min(1, 'La confirmation est requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ================================================================================== //
// Preferences / Notifications
// ================================================================================== //

export const updatePreferencesSchema = z.object({
  language: z.string().optional(),
  notifications: z.boolean().optional(),
  medicationReminders: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  promotions: z.boolean().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
