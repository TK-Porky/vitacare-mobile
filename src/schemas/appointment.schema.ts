import { z } from 'zod';
import type { TFunction } from 'i18next';

// ================================================================================== //
// Creation
// ================================================================================== //

// Query
export const createAppointmentSchema = (t: TFunction) => z.object({
  providerId: z.string().min(1, t('validation.required')),
  date: z.string().min(1, t('validation.required')),
  time: z.string().min(1, t('validation.required')),
  reason: z.string().min(3, t('validation.required')),
  paymentMethod: z.enum(['now', 'later', 'mobile_money', 'orange_money', 'card']),
  notes: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<ReturnType<typeof createAppointmentSchema>>;

// ================================================================================== //
// Update
// ================================================================================== /

// Query
export const updateAppointmentSchema = (t: TFunction) => z.object({
  date: z.string().optional(),
  time: z.string().optional(),
  reason: z.string().min(3, t('validation.required')).optional(),
  notes: z.string().optional(),
});

export type UpdateAppointmentInput = z.infer<ReturnType<typeof updateAppointmentSchema>>;

// ================================================================================== //
// Cancellation
// ================================================================================== //

// Query
export const cancelAppointmentSchema = (t: TFunction) => z.object({
  reason: z.string().min(5, t('validation.required')),
  refundRequested: z.boolean().default(false),
});

export type CancelAppointmentInput = z.infer<ReturnType<typeof cancelAppointmentSchema>>;

// ================================================================================== //
// Rescheduling
// ================================================================================== //

// Query
export const rescheduleAppointmentSchema = (t: TFunction) => z.object({
  newDate: z.string().min(1, t('validation.required')),
  newTime: z.string().min(1, t('validation.required')),
  reason: z.string().optional(),
});

export type RescheduleAppointmentInput = z.infer<ReturnType<typeof rescheduleAppointmentSchema>>;
