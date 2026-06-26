import { z } from 'zod';

// ================================================================================== //
// Dashboard
// ================================================================================== //

// Query Schema
export const dashboardQuerySchema = z.object({
  date: z.string().optional(),
  includeMedications: z.boolean().default(true),
  includeAppointments: z.boolean().default(true),
  includeObservances: z.boolean().default(true),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;

// ================================================================================== //
// Observance
// ================================================================================== //

// Query Schema
export const updateObservanceSchema = z.object({
  observanceId: z.string().min(1),
  completed: z.boolean(),
  completedAt: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateObservanceInput = z.infer<typeof updateObservanceSchema>;
