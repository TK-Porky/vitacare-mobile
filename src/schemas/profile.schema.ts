import { z } from "zod";
import type { TFunction } from "i18next";

const phoneRegex = /^[6](2|5|6|7|8|9)[0-9]{7}$/;

export const getUpdateProfileSchema = (t: TFunction) =>
  z.object({
    fullName: z.string().min(2, t("validation.fullNameRequired")),
    email: z
      .string()
      .min(1, t("validation.emailRequired"))
      .email(t("validation.emailInvalid")),
    gender: z.string().optional(),
    dateOfBirth: z.string().optional(),
    bloodGroup: z.string().optional(),
    medicalHistory: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  });

export type UpdateProfileInput = z.infer<ReturnType<typeof getUpdateProfileSchema>>;

export const getUpdateLocationSchema = (t: TFunction) =>
  z.object({
    location: z.string().min(1, t("validation.required")),
  });

export type UpdateLocationInput = z.infer<ReturnType<typeof getUpdateLocationSchema>>;

export const getChangePasswordSchema = (t: TFunction) =>
  z
    .object({
      currentPassword: z.string().min(1, t("validation.currentPasswordRequired")),
      newPassword: z
        .string()
        .min(8, t("validation.passwordMin"))
        .refine((s) => !s.includes(" "), t("validation.passwordSpace")),
      confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("validation.passwordMismatch"),
      path: ["confirmPassword"],
    });

export type ChangePasswordInput = z.infer<ReturnType<typeof getChangePasswordSchema>>;

export const getUpdatePreferencesSchema = (t: TFunction) =>
  z.object({
    language: z.string().optional(),
    notifications: z.boolean().optional(),
    medicationReminders: z.boolean().optional(),
    appointmentReminders: z.boolean().optional(),
    promotions: z.boolean().optional(),
  });

export type UpdatePreferencesInput = z.infer<ReturnType<typeof getUpdatePreferencesSchema>>;
