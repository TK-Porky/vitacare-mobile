import { NotificationData } from "./notifications";
import { ClinicProvider } from "./clinicProvider";

/**
 * Types des réponses API pour la communication avec le backend VitaCare
 */

// ---------------------------------------------------------------------------
// Réponses génériques
// ---------------------------------------------------------------------------

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface BackendPaginatedResponse<T = NotificationData> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T = NotificationData> extends ApiResponse<
  T[]
> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ---------------------------------------------------------------------------
// Authentification
// ---------------------------------------------------------------------------

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  token: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  message: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// Cliniques et professionnels
// ---------------------------------------------------------------------------

export type ClinicProviderResponse = ClinicProvider;

export interface ClinicsListResponse extends PaginatedResponse<ClinicProviderResponse> {}

export interface ClinicDetailResponse extends ApiResponse<ClinicProviderResponse> {}

// ---------------------------------------------------------------------------
// Réservations
// ---------------------------------------------------------------------------

export interface BookingRequest {
  providerId: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  reason: string;
  paymentMethod: "now" | "later";
  paymentProvider?: "mobile_money" | "orange_money" | "card";
}

export interface BookingResponse {
  id: string;
  providerId: string;
  date: string;
  time: string;
  reason: string;
  paymentMethod: string;
  paymentProvider?: string;
  status: AppointmentStatus;
  total: number;
  currency: string;
  createdAt: string;
  provider: ClinicProvider;
}

export interface TimeSlotsResponse {
  date: string;
  availableSlots: string[];
  bookedSlots: string[];
}

// ---------------------------------------------------------------------------
// Rendez-vous
// ---------------------------------------------------------------------------

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "PAID"
  | "RESCHEDULED";

export interface AppointmentResponse {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  doctorAvatarUrl: string | null;
  specialty: string;
  clinicName: string;
  clinicAddress: string;
  dateTime: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  reason: string | null;
  total: number | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  doctorNotes: string | null;
  createdAt: string;
}

export interface AppointmentsListResponse {
  items: AppointmentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AppointmentDetailResponse {
  data: AppointmentResponse;
}

export interface RescheduleRequest {
  newDate: string;
  newTime: string;
  reason?: string;
}

export interface CancelRequest {
  reason?: string;
  refundRequested?: boolean;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStatsResponse {
  total: number;
  completed: number;
  pending: number;
  observance: number;
}

export interface MedicationResponse {
  id: number;
  name: string;
  time: string;
  dosage: string;
  status: "taken" | "missed" | "pending";
  active?: boolean;
}

export interface DashboardResponse extends ApiResponse<{
  currentUser: string;
  currentDate: string;
  stats: DashboardStatsResponse;
  streak: number;
  activeMedications: number;
  monthlyProgress: number;
  medications: MedicationResponse[];
  appointments: AppointmentResponse[];
  appointmentsToday: AppointmentResponse[];
}> {}

// ---------------------------------------------------------------------------
// Médecins / Docteurs
// ---------------------------------------------------------------------------

export interface MedecinDTO {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  specialization: string;
  licenseNumber: string;
  experienceYears: number | null;
  teleconsultationEnabled: boolean;
  serviceLocationImageUrl: string | null;
  consultationFee: number | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  bio: string | null;
  cabinet: string | null;
  address: string | null;
  hours: string | null;
  days: string | null;
  valide: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ReviewDTO {
  id: number;
  patientName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface DoctorDetailResponse {
  doctor: MedecinDTO;
  availabilities: any[];
  averageRating: number | null;
  reviewCount: number;
  latestReviews: ReviewDTO[];
}

// ---------------------------------------------------------------------------
// Paiements
// ---------------------------------------------------------------------------

export interface PaymentResponse {
  id: number;
  appointmentId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus:
    | "PENDING"
    | "PROCESSING"
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED"
    | "REFUNDED";
  sharepayReference: string | null;
  sharepayTransactionId: string | null;
  phoneNumber: string;
  description: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface NotificationResponse {
  id: string;
  title: string;
  body: string;
  type: "appointment" | "medication" | "payment" | "system";
  read: boolean;
  createdAt: string;
  data?: any;
}

export interface NotificationsListResponse extends PaginatedResponse<NotificationResponse> {}

export interface MarkNotificationReadResponse extends ApiResponse<null> {}

// ---------------------------------------------------------------------------
// Store Medications (Catalogue Medipedia/BDPM)
// ---------------------------------------------------------------------------

export interface StoreMedicationResponse {
  id: string;
  name: string;
  commonName?: string;
  activeIngredients?: string;
  dosage?: string;
  dosageForm?: string;
  manufacturer?: string;
  cis?: string;
  atcCode?: string;
  requiresPrescription?: boolean;
  isGeneric?: boolean;
  referencePrice?: number;
  stockStatus?: string;
  isActive?: boolean;
  imageUrl?: string;
}

export interface MedicationDetailResponse extends StoreMedicationResponse {
  concentration?: string;
  route?: string;
  cipCode?: string;
  categoryId?: string;
  galenicFormId?: string;
  administrationRouteId?: string;
  dosageUnitId?: string;
  composition?: { role?: string; quantity?: string; substance?: string }[];
  presentations?: { quantity?: string; packaging?: string }[];
  indications?: string;
  contraindications?: string;
  precautions?: string;
  sideEffects?: string;
  conservation?: string;
  storageConditions?: string[];
  dispensationClass?: string;
  stockQuantity?: number;
  restockThreshold?: number;
  createdAt?: string;
  images?: {
    id: string;
    medicationId?: string;
    url: string;
    alt?: string;
    isPrimary?: boolean;
    type?: string;
    mimeType?: string;
    displayOrder?: number;
  }[];
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

export type ReminderStatus = "PENDING" | "TAKEN" | "MISSED";

export interface ReminderResponse {
  id: number;
  patientId: number;
  medicationId: number;
  medicationName: string;
  dosage: string;
  patientName: string;
  status: ReminderStatus;
  form: string;
  frequency: string;
  times: string[];
  active: boolean;
  medicationDosage: string;
  scheduledHour: string;
  name: string;
  time: string;

  scheduledDate?: string;
  scheduledTime?: string;
  takenAt?: string;
  snoozedUntil?: string;
  snoozeCount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RemindersListResponse {
  items: ReminderResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: {
    pending: number;
    taken: number;
    missed: number;
    total: number;
  };
}

export interface ReminderDetailResponse extends ApiResponse<ReminderResponse> {}

// ---------------------------------------------------------------------------
// Profil utilisateur
// ---------------------------------------------------------------------------

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  bloodGroup?: string;
  medicalHistory?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  profilComplete: boolean;
  preferences: {
    language: string;
    notifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  statusCode: number;
  message: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Erreurs spécifiques
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse extends ApiResponse {
  errors?: ValidationError[];
  errorCode?: string;
}

// ---------------------------------------------------------------------------
// Types d'état pour les requêtes
// ---------------------------------------------------------------------------

export type RequestStatus = "idle" | "loading" | "success" | "error";

export interface RequestState<T = any> {
  status: RequestStatus;
  data?: T;
  error?: string;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}
