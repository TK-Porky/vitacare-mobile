import { z } from 'zod';

// ================================================================================== //
// Creation
// ================================================================================== /

// Schema
export const addMedicationSchema = z.object({
  name: z.string().min(2, 'Le nom du médicament est requis'),
  dosage: z.string().min(1, 'Le dosage est requis'),
  frequency: z.string().min(1, 'La fréquence est requise'),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().optional(),
  times: z.array(z.string()).min(1, 'Au moins une heure de prise est requise'),
  notes: z.string().optional(),
});

export type AddMedicationInput = z.infer<typeof addMedicationSchema>;

// ================================================================================== //
// Intake Status
// ================================================================================== /

// Schema
export const updateMedicationStatusSchema = z.object({
  medicationId: z.string().min(1),
  status: z.enum(['taken', 'missed', 'pending']),
  takenAt: z.string().optional(),
});

export type UpdateMedicationStatusInput = z.infer<typeof updateMedicationStatusSchema>;
