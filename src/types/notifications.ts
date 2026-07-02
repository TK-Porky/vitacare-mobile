export type NotificationCategory =
  | "appointment_reminder"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "treatment_reminder"
  | "treatment_refill"
  | "health_tip"
  | "system";

export type NotificationPriority = "low" | "normal" | "high";

export interface NotificationPreferences {
  appointmentReminders: boolean;
  treatmentReminders: boolean;
  healthTips: boolean;
  reminderLeadTimeMinutes: number; // how many minutes before appointment
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface NotificationData {
  id?: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  readAt?: string;
  scheduledFor?: string;
}

export interface ReminderNotificationData {
  reminderId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  minutes?: number;
  action?: "take" | "snooze" | "skip";
}

export interface NotificationMetadata {
  appointmentId?: string;
  treatmentId?: string;
  doctorName?: string;
  treatmentName?: string;
  appointmentTime?: string;
  [key: string]: unknown;
}
