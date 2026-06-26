import { z } from 'zod';

// ================================================================================== //
// Creation
// ================================================================================== /

// Query
export const createAppointmentSchema = z.object({
  providerId: z.string().min(1, 'Le prestataire est requis'),
  date: z.string().min(1, 'La date est requise'),
  time: z.string().min(1, 'L\'heure est requise'),
  reason: z.string().min(3, 'Le motif doit contenir au moins 3 caractères'),
  paymentMethod: z.enum(['now', 'later', 'mobile_money', 'orange_money', 'card']),
  notes: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// ================================================================================== //
// Update
// ================================================================================== /

// Query
export const updateAppointmentSchema = z.object({
  date: z.string().optional(),
  time: z.string().optional(),
  reason: z.string().min(3, 'Le motif doit contenir au moins 3 caractères').optional(),
  notes: z.string().optional(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// ================================================================================== //
// Cancellation
// ================================================================================== /

// Query
export const cancelAppointmentSchema = z.object({
  reason: z.string().min(5, 'Veuillez indiquer une raison (min 5 caractères)'),
  refundRequested: z.boolean().default(false),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

// ================================================================================== //
// Rescheduling
// ================================================================================== /

// Query
export const rescheduleAppointmentSchema = z.object({
  newDate: z.string().min(1, 'La nouvelle date est requise'),
  newTime: z.string().min(1, 'La nouvelle heure est requise'),
  reason: z.string().optional(),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
