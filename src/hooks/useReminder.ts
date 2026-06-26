/**
 * Reminder hooks for managing medication intake reminders
 * 
 * @remarks
 * This hook provides reminder operations including fetching, creating, updating,
 * and managing reminder status. It uses TanStack Query for state management
 * and React Query for data fetching.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reminderService } from '../services/reminder.service';
import type { 
  CreateReminderRequest, 
  UpdateReminderRequest,
  RemindersListQuery 
} from '../types/api-requests';

// Query keys for caching and invalidation
export const reminderKeys = {
  all: ['reminders'] as const,
  lists: () => [...reminderKeys.all, 'list'] as const,
  list: (query?: RemindersListQuery) => [...reminderKeys.lists(), query] as const,
  details: () => [...reminderKeys.all, 'detail'] as const,
  detail: (id: string) => [...reminderKeys.details(), id] as const,
  summary: () => [...reminderKeys.all, 'summary'] as const,
  upcoming: () => [...reminderKeys.all, 'upcoming'] as const,
  today: () => [...reminderKeys.all, 'today'] as const,
  patient: (patientId: string) => [...reminderKeys.all, 'patient', patientId] as const,
  medication: (medicationId: string) => [...reminderKeys.all, 'medication', medicationId] as const,
};

export const useReminders = (query?: RemindersListQuery) => {
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Get all reminders with pagination and filtering
   */
  const remindersQuery = useQuery({
    queryKey: reminderKeys.list(query),
    queryFn: () => reminderService.getReminders(query),
  });

  /**
   * Get a specific reminder by ID
   */
  const useReminder = (reminderId: string) => {
    return useQuery({
      queryKey: reminderKeys.detail(reminderId),
      queryFn: () => reminderService.getReminder(reminderId),
      enabled: !!reminderId,
    });
  };

  /**
   * Get reminder summary statistics
   */
  const useSummary = () => {
    return useQuery({
      queryKey: reminderKeys.summary(),
      queryFn: () => reminderService.getSummary(),
    });
  };

  /**
   * Get upcoming reminders
   */
  const useUpcomingReminders = () => {
    return useQuery({
      queryKey: reminderKeys.upcoming(),
      queryFn: () => reminderService.getUpcomingReminders(),
    });
  };

  /**
   * Get today's reminders
   */
  const useTodayReminders = () => {
    return useQuery({
      queryKey: reminderKeys.today(),
      queryFn: () => reminderService.getTodaySchedule(),
    });
  };

  /**
   * Get reminders for a specific patient
   */
  const usePatientReminders = (patientId: string, patientQuery?: RemindersListQuery) => {
    return useQuery({
      queryKey: reminderKeys.patient(patientId),
      queryFn: () => reminderService.getPatientReminders(patientId, patientQuery),
      enabled: !!patientId,
    });
  };

  /**
   * Get reminders for a specific medication
   */
  const useMedicationReminders = (medicationId: string, medicationQuery?: RemindersListQuery) => {
    return useQuery({
      queryKey: reminderKeys.medication(medicationId),
      queryFn: () => reminderService.getMedicationReminders(medicationId, medicationQuery),
      enabled: !!medicationId,
    });
  };

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Create a new reminder
   */
  const createReminderMutation = useMutation({
    mutationFn: (data: CreateReminderRequest) => reminderService.createReminder(data),
    onSuccess: () => {
      // Invalidate and refetch reminders list
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
    },
  });

  /**
   * Update an existing reminder
   */
  const updateReminderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReminderRequest }) => 
      reminderService.updateReminder(id, data),
    onSuccess: (data, variables) => {
      // Update the specific reminder in cache
      queryClient.setQueryData(reminderKeys.detail(variables.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
    },
  });

  /**
   * Delete a reminder
   */
  const deleteReminderMutation = useMutation({
    mutationFn: (id: string) => reminderService.deleteReminder(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: reminderKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
    },
  });

  /**
   * Mark a reminder as taken
   */
  const markAsTakenMutation = useMutation({
    mutationFn: ({ id, takenAt }: { id: string; takenAt?: string }) => 
      reminderService.markAsTaken(id, takenAt),
    onSuccess: (data, variables) => {
      // Update the specific reminder in cache
      queryClient.setQueryData(reminderKeys.detail(variables.id), data);
      // Invalidate lists and summary
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
    },
  });

  /**
   * Snooze a reminder
   */
  const snoozeReminderMutation = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) => 
      reminderService.snoozeReminder(id, minutes),
    onSuccess: (data, variables) => {
      // Update the specific reminder in cache
      queryClient.setQueryData(reminderKeys.detail(variables.id), data);
      // Invalidate lists and summary
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
    },
  });

  /**
   * Create multiple reminders at once
   */
  const createBulkRemindersMutation = useMutation({
    mutationFn: ({ patientId, reminders }: { patientId: string; reminders: Omit<CreateReminderRequest, 'patientId'>[] }) => 
      reminderService.createBulkReminders(patientId, reminders),
    onSuccess: () => {
      // Invalidate all reminders queries
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });

  /**
   * Mark specific reminders as read
   */
  const markAsReadMutation = useMutation({
    mutationFn: (reminderIds: string[]) => reminderService.markAsRead(reminderIds),
    onSuccess: () => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
    },
  });

  /**
   * Mark all reminders as read
   */
  const markAllAsReadMutation = useMutation({
    mutationFn: () => reminderService.markAllAsRead(),
    onSuccess: () => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
    },
  });

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // Queries
    reminders: remindersQuery.data?.items || [],
    pagination: remindersQuery.data?.pagination || null,
    summary: remindersQuery.data?.summary || null,
    isLoading: remindersQuery.isLoading,
    isFetching: remindersQuery.isFetching,
    error: remindersQuery.error,
    refetch: remindersQuery.refetch,

    // Individual query hooks (to be used in components)
    useReminder,
    useSummary,
    useUpcomingReminders,
    useTodayReminders,
    usePatientReminders,
    useMedicationReminders,

    // Mutations
    createReminder: createReminderMutation.mutate,
    createReminderAsync: createReminderMutation.mutateAsync,
    isCreating: createReminderMutation.isPending,
    createError: createReminderMutation.error,

    updateReminder: updateReminderMutation.mutate,
    updateReminderAsync: updateReminderMutation.mutateAsync,
    isUpdating: updateReminderMutation.isPending,
    updateError: updateReminderMutation.error,

    deleteReminder: deleteReminderMutation.mutate,
    deleteReminderAsync: deleteReminderMutation.mutateAsync,
    isDeleting: deleteReminderMutation.isPending,
    deleteError: deleteReminderMutation.error,

    markAsTaken: markAsTakenMutation.mutate,
    markAsTakenAsync: markAsTakenMutation.mutateAsync,
    isMarkingAsTaken: markAsTakenMutation.isPending,
    markAsTakenError: markAsTakenMutation.error,

    snoozeReminder: snoozeReminderMutation.mutate,
    snoozeReminderAsync: snoozeReminderMutation.mutateAsync,
    isSnoozing: snoozeReminderMutation.isPending,
    snoozeError: snoozeReminderMutation.error,

    createBulkReminders: createBulkRemindersMutation.mutate,
    createBulkRemindersAsync: createBulkRemindersMutation.mutateAsync,
    isCreatingBulk: createBulkRemindersMutation.isPending,
    createBulkError: createBulkRemindersMutation.error,

    markAsRead: markAsReadMutation.mutate,
    markAsReadAsync: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAsReadError: markAsReadMutation.error,

    markAllAsRead: markAllAsReadMutation.mutate,
    markAllAsReadAsync: markAllAsReadMutation.mutateAsync,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    markAllAsReadError: markAllAsReadMutation.error,
  };
};