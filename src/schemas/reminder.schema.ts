import { z } from 'zod';

// ================================================================================== //
// Read Status
// ================================================================================== //

export const markReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
});

export type MarkReadInput = z.infer<typeof markReadSchema>;

// ================================================================================== //
// Preferences
// ================================================================================== //

export const notificationPreferencesSchema = z.object({
  push: z.boolean().default(true),
  email: z.boolean().default(false),
  sms: z.boolean().default(true),
  appointmentReminders: z.boolean().default(true),
  medicationReminders: z.boolean().default(true),
  paymentReminders: z.boolean().default(true),
  promotions: z.boolean().default(false),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

// ================================================================================== //
// Push Notification
// ================================================================================== //

export const pushRegistrationSchema = z.object({
  deviceToken: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

export type PushRegistrationInput = z.infer<typeof pushRegistrationSchema>;
