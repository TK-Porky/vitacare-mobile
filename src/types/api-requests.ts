/**
 * Types des requêtes API pour la communication avec le backend VitaCare
 */

// ---------------------------------------------------------------------------
// Authentification
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
  deviceToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullname: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ---------------------------------------------------------------------------
// Cliniques et professionnels
// ---------------------------------------------------------------------------

export interface ClinicsListQuery {
  page?: number;
  limit?: number;
  specialty?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  search?: string;
  sortBy?: 'name' | 'price' | 'rating' | 'distance';
  sortOrder?: 'asc' | 'desc';
}

export interface ClinicSearchRequest {
  query: string;
  filters?: {
    specialty?: string[];
    location?: string[];
    priceRange?: [number, number];
    rating?: number;
    availableToday?: boolean;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
    radius?: number; // en km
  };
}

// ---------------------------------------------------------------------------
// Réservations
// ---------------------------------------------------------------------------

export interface CreateBookingRequest {
  providerId: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  reason: string;
  paymentMethod: 'now' | 'later';
  paymentProvider?: 'mobile_money' | 'orange_money' | 'card';
  notes?: string;
}

export interface UpdateBookingRequest {
  date?: string;
  time?: string;
  reason?: string;
  paymentMethod?: 'now' | 'later';
  paymentProvider?: 'mobile_money' | 'orange_money' | 'card';
  notes?: string;
}

export interface CancelBookingRequest {
  reason?: string;
  refundRequested?: boolean;
}

export interface RescheduleBookingRequest {
  newDate: string;
  newTime: string;
  reason?: string;
}

export interface GetAvailableSlotsRequest {
  providerId: string;
  date: string; // ISO date string
}

// ---------------------------------------------------------------------------
// Rendez-vous
// ---------------------------------------------------------------------------

export interface AppointmentsListQuery {
  page?: number;
  limit?: number;
  status?: 'confirmed' | 'pending' | 'paid' | 'cancelled' | 'all';
  startDate?: string;
  endDate?: string;
  providerId?: string;
}

export interface CreateAppointmentRequest {
  providerId: number | string;
  date: string;
  time: string;
  reason: string;
  paymentMethod: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  date?: string;
  time?: string;
  reason?: string;
  notes?: string;
}

export interface CancelAppointmentRequest {
  reason?: string;
  refundRequested?: boolean;
}

export interface RescheduleAppointmentRequest {
  newDate: string;
  newTime: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardQuery {
  date?: string; // ISO date string pour filtrer par date
  includeMedications?: boolean;
  includeAppointments?: boolean;
  includeObservances?: boolean;
}

export interface UpdateMedicationStatusRequest {
  medicationId: number;
  status: 'taken' | 'missed';
  takenAt?: string; // ISO datetime string
}

export interface AddMedicationRequest {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  times: string[];
  notes?: string;
}

export interface UpdateObservanceRequest {
  observanceId: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Paiements
// ---------------------------------------------------------------------------

export interface InitiatePaymentRequest {
  appointmentId: number;
  amount: number;
  paymentMethod: 'MTN_MOMO_CM' | 'ORANGE_MONEY_CM' | 'CARD_VISA' | 'CARD_MASTERCARD';
  phoneNumber: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface MarkNotificationsReadRequest {
  notificationIds?: string[]; // si vide, marque toutes comme lues
}

export interface UpdateNotificationPreferencesRequest {
  push?: boolean;
  email?: boolean;
  sms?: boolean;
  appointmentReminders?: boolean;
  medicationReminders?: boolean;
  paymentReminders?: boolean;
  promotions?: boolean;
}

// ---------------------------------------------------------------------------
// Reminders (NEW)
// ---------------------------------------------------------------------------

export interface CreateReminderRequest {
  medicationId: string;
  patientId: string;
  scheduledDate: string; // ISO date string
  scheduledTime: string; // HH:mm format
  notes?: string;
}

export interface UpdateReminderRequest {
  medicationId?: string;
  scheduledDate?: string; // ISO date string
  scheduledTime?: string; // HH:mm format
  status?: 'PENDING' | 'TAKEN' | 'SNOOZED' | 'MISSED' | 'CANCELLED';
  notes?: string;
}

export interface MarkReminderTakenRequest {
  reminderId: string;
  takenAt?: string; // ISO datetime string, defaults to now
}

export interface SnoozeReminderRequest {
  reminderId: string;
  minutes: number; // Number of minutes to snooze
}

export interface RemindersListQuery {
  page?: number;
  limit?: number;
  status?: ReminderStatus | 'all';
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  patientId?: string;
  medicationId?: string;
}

export interface BulkCreateRemindersRequest {
  reminders: Omit<CreateReminderRequest, 'patientId'>[];
  patientId: string;
}

export interface MarkReminderReadRequest {
  reminderIds?: string[]; // if empty, marks all as read
}

// Re-export status type for convenience
export type ReminderStatus = 'PENDING' | 'TAKEN' | 'SNOOZED' | 'MISSED' | 'CANCELLED';

// ---------------------------------------------------------------------------
// Profil utilisateur
// ---------------------------------------------------------------------------

export interface UpdateProfileRequest {
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  medicalHistory?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdatePreferencesRequest {
  language?: string;
  notifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  currency?: string;
  timezone?: string;
}

export interface UploadAvatarRequest {
  file: File | Blob;
  mimeType: string;
}

export interface DeleteAccountRequest {
  password: string;
  reason?: string;
  confirmDeletion: boolean;
}

// ---------------------------------------------------------------------------
// Recherche et filtres
// ---------------------------------------------------------------------------

export interface SearchRequest {
  query: string;
  type: 'clinics' | 'doctors' | 'specialties' | 'all';
  filters?: SearchFilters;
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface SearchFilters {
  specialty?: string[];
  location?: string[];
  priceRange?: [number, number];
  rating?: number;
  availability?: {
    date?: string;
    timeSlot?: string;
  };
  features?: string[];
}

// ---------------------------------------------------------------------------
// Reviews et ratings
// ---------------------------------------------------------------------------

export interface CreateReviewRequest {
  providerId: string;
  appointmentId: string;
  rating: number; // 1-5
  comment?: string;
  anonymous?: boolean;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  anonymous?: boolean;
}

export interface ReviewsListQuery {
  providerId?: string;
  page?: number;
  limit?: number;
  rating?: number;
  sortBy?: 'date' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Signalements et support
// ---------------------------------------------------------------------------

export interface ReportRequest {
  type: 'provider' | 'appointment' | 'payment' | 'technical';
  targetId: string;
  reason: string;
  description: string;
  attachments?: string[]; // URLs des fichiers joints
}

export interface ContactSupportRequest {
  subject: string;
  message: string;
  category: 'technical' | 'billing' | 'appointment' | 'general';
  priority?: 'low' | 'medium' | 'high';
  attachments?: string[];
}

// ---------------------------------------------------------------------------
// Utilitaires pour les requêtes
// ---------------------------------------------------------------------------

export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

export interface FileUploadRequest {
  file: File | Blob;
  fieldName?: string;
  metadata?: Record<string, any>;
}

export interface BulkRequest<T> {
  items: T[];
  options?: {
    continueOnError?: boolean;
    validateOnly?: boolean;
  };
}