// services/reminder.service.ts

import { apiClient } from "../lib/api.client";
import { API_ENDPOINTS } from "../types/api-endpoints";
import { 
  CreateReminderRequest, 
  UpdateReminderRequest,
  RemindersListQuery
} from "../types/api-requests";
import { 
  ReminderResponse, 
  RemindersListResponse,
  ReminderDetailResponse
} from "../types/api-responses";

/**
 * Helper to build query string
 * This matches how other services (dashboard, appointments) work
 */
const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';
  
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Reminder Service
 * Manages medication intake reminders for users.
 */
export const reminderService = {
  /**
   * Get all reminders for the user with pagination and filtering
   */
  async getReminders(query?: RemindersListQuery): Promise<RemindersListResponse> {
    // Build the URL with query string
    const queryString = buildQueryString(query);
    const url = `${API_ENDPOINTS.REMINDERS.LIST}${queryString}`;
    
    const res = await apiClient.get<RemindersListResponse>(url);
    if (!res.success) throw new Error(res.error ?? "Failed to fetch reminders");
    return res.data!;
  },

  /**
   * Get a specific reminder by ID
   */
  async getReminder(reminderId: string): Promise<ReminderResponse> {
    const res = await apiClient.get<ReminderDetailResponse>(
      API_ENDPOINTS.REMINDERS.GET(reminderId)
    );
    if (!res.success) throw new Error(res.error ?? "Failed to fetch reminder");
    return res.data!.data!;
  },

  /**
   * Create a new reminder
   */
  async createReminder(data: CreateReminderRequest): Promise<ReminderResponse> {
    const res = await apiClient.post<ReminderDetailResponse>(
      API_ENDPOINTS.REMINDERS.CREATE, 
      data
    );
    if (!res.success) throw new Error(res.error ?? "Failed to create reminder");
    return res.data!.data!;
  },

  /**
   * Update an existing reminder
   */
  async updateReminder(reminderId: string, data: UpdateReminderRequest): Promise<ReminderResponse> {
    const res = await apiClient.put<ReminderDetailResponse>(
      API_ENDPOINTS.REMINDERS.UPDATE(reminderId), 
      data
    );
    if (!res.success) throw new Error(res.error ?? "Failed to update reminder");
    return res.data!.data!;
  },

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string): Promise<void> {
    const res = await apiClient.delete(API_ENDPOINTS.REMINDERS.DELETE(reminderId));
    if (!res.success) throw new Error(res.error ?? "Failed to delete reminder");
  },

  /**
   * Mark a reminder as taken (acknowledge intake)
   */
  async markAsTaken(reminderId: string, takenAt?: string): Promise<ReminderResponse> {
    const res = await apiClient.post<ReminderDetailResponse>(
      API_ENDPOINTS.REMINDERS.MARK_TAKEN,
      { reminderId, takenAt }
    );
    if (!res.success) throw new Error(res.error ?? "Failed to mark reminder as taken");
    return res.data!.data!;
  },

  /**
   * Snooze a reminder for a specified duration (minutes)
   */
  async snoozeReminder(reminderId: string, minutes: number): Promise<ReminderResponse> {
    const res = await apiClient.post<ReminderDetailResponse>(
      API_ENDPOINTS.REMINDERS.SNOOZE,
      { reminderId, minutes }
    );
    if (!res.success) throw new Error(res.error ?? "Failed to snooze reminder");
    return res.data!.data!;
  },

  /**
   * Get upcoming reminders (next 24 hours)
   */
  async getUpcomingReminders(): Promise<RemindersListResponse> {
    const res = await apiClient.get<RemindersListResponse>(
      API_ENDPOINTS.REMINDERS.UPCOMING
    );
    if (!res.success) throw new Error(res.error ?? "Failed to fetch upcoming reminders");
    return res.data!;
  },

  /**
   * Get today's intake schedule
   */
  async getTodaySchedule(): Promise<RemindersListResponse> {
    const res = await apiClient.get<RemindersListResponse>(
      API_ENDPOINTS.REMINDERS.TODAY
    );
    if (!res.success) throw new Error(res.error ?? "Failed to fetch today's schedule");
    return res.data!;
  },

  /**
   * Get reminder summary statistics
   */
  async getSummary(): Promise<{
    pending: number;
    taken: number;
    missed: number;
    total: number;
  }> {
    const res = await apiClient.get<{
      pending: number;
      taken: number;
      missed: number;
      total: number;
    }>(API_ENDPOINTS.REMINDERS.SUMMARY);
    if (!res.success) throw new Error(res.error ?? "Failed to fetch reminder summary");
    return res.data!;
  },

  /**
   * Get reminders for a specific patient
   */
  async getPatientReminders(patientId: string, query?: RemindersListQuery): Promise<RemindersListResponse> {
    const queryString = buildQueryString(query);
    const url = `${API_ENDPOINTS.REMINDERS.PATIENT(patientId)}${queryString}`;
    
    const res = await apiClient.get<RemindersListResponse>(url);
    if (!res.success) throw new Error(res.error ?? "Failed to fetch patient reminders");
    return res.data!;
  },

  /**
   * Get reminders for a specific medication
   */
  async getMedicationReminders(medicationId: string, query?: RemindersListQuery): Promise<RemindersListResponse> {
    const queryString = buildQueryString(query);
    const url = `${API_ENDPOINTS.REMINDERS.MEDICATION(medicationId)}${queryString}`;
    
    const res = await apiClient.get<RemindersListResponse>(url);
    if (!res.success) throw new Error(res.error ?? "Failed to fetch medication reminders");
    return res.data!;
  },

  /**
   * Create multiple reminders at once
   */
  async createBulkReminders(patientId: string, reminders: Omit<CreateReminderRequest, 'patientId'>[]): Promise<ReminderResponse[]> {
    const res = await apiClient.post<{ reminders: ReminderResponse[] }>(
      API_ENDPOINTS.REMINDERS.BULK_CREATE,
      { patientId, reminders }
    );
    if (!res.success) throw new Error(res.error ?? "Failed to create bulk reminders");
    return res.data!.reminders;
  },

  /**
   * Mark specific reminders as read
   */
  async markAsRead(reminderIds: string[]): Promise<void> {
    const res = await apiClient.post(
      API_ENDPOINTS.REMINDERS.MARK_READ,
      { reminderIds }
    );
    if (!res.success) throw new Error(res.error ?? "Failed to mark reminders as read");
  },

  /**
   * Mark all reminders as read
   */
  async markAllAsRead(): Promise<void> {
    const res = await apiClient.post(API_ENDPOINTS.REMINDERS.MARK_ALL_READ);
    if (!res.success) throw new Error(res.error ?? "Failed to mark all reminders as read");
  }
};