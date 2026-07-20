// hooks/useReminders.ts
/**
 * Reminder hooks for managing medication intake reminders
 *
 * @remarks
 * This hook provides reminder operations including fetching, creating, updating,
 * and managing reminder status. It uses TanStack Query for state management
 * and React Query for data fetching.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reminderService } from "@/services/reminder.service";
import type {
  CreateReminderRequest,
  UpdateReminderRequest,
  RemindersListQuery,
} from "@/types/api-requests";
import { ReminderResponse } from "@/types";

// Query keys for caching and invalidation
export const reminderKeys = {
  all: ["reminders"] as const,
  lists: () => [...reminderKeys.all, "list"] as const,
  list: (query?: RemindersListQuery) =>
    [...reminderKeys.lists(), query] as const,
  details: () => [...reminderKeys.all, "detail"] as const,
  detail: (id: string) => [...reminderKeys.details(), id] as const,
  summary: () => [...reminderKeys.all, "summary"] as const,
  upcoming: () => [...reminderKeys.all, "upcoming"] as const,
  today: () => [...reminderKeys.all, "today"] as const,
  patient: (patientId: string) =>
    [...reminderKeys.all, "patient", patientId] as const,
  medication: (medicationId: string) =>
    [...reminderKeys.all, "medication", medicationId] as const,
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
    queryFn: async () => {
      const result = await reminderService.getReminders(query);
      console.log("[useReminders] Service result:", result);

      return {
        items: result.items || [],
        pagination: result.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
        summary: result.summary || { pending: 0, taken: 0, missed: 0 },
      };
    },
  });

  /**
   * Real-time statistics summary query from backend
   */
  const summaryQuery = useQuery({
    queryKey: reminderKeys.summary(),
    queryFn: () => reminderService.getSummary(),
  });

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
  const usePatientReminders = (
    patientId: string,
    patientQuery?: RemindersListQuery,
  ) => {
    return useQuery({
      queryKey: reminderKeys.patient(patientId),
      queryFn: () =>
        reminderService.getPatientReminders(patientId, patientQuery),
      enabled: !!patientId,
    });
  };

  /**
   * Get reminders for a specific medication
   */
  const useMedicationReminders = (
    medicationId: string,
    medicationQuery?: RemindersListQuery,
  ) => {
    return useQuery({
      queryKey: reminderKeys.medication(medicationId),
      queryFn: () =>
        reminderService.getMedicationReminders(medicationId, medicationQuery),
      enabled: !!medicationId,
    });
  };

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Create a new reminder
   * ✅ La notification est gérée par reminderService.createReminder
   */
  const createReminderMutation = useMutation({
    mutationFn: (data: CreateReminderRequest) =>
      reminderService.createReminder(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.today() });
    },
  });

  /**
   * Update an existing reminder
   * ✅ La notification est gérée par reminderService.updateReminder
   */
  const updateReminderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReminderRequest }) =>
      reminderService.updateReminder(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(reminderKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.today() });
    },
  });

  /**
   * Delete a reminder
   * ✅ La notification est gérée par reminderService.deleteReminder
   */
  const deleteReminderMutation = useMutation({
    mutationFn: (id: string) => reminderService.deleteReminder(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: reminderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.today() });
    },
  });

  /**
   * Mark a reminder as taken
   * ✅ La notification est gérée par reminderService.markAsTaken
   */
  const markAsTakenMutation = useMutation({
    mutationFn: ({ id, takenAt }: { id: string; takenAt?: string }) =>
      reminderService.markAsTaken(id, takenAt),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(reminderKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.today() });
    },
  });

  /**
   * Snooze a reminder
   * ✅ La notification est gérée par reminderService.snoozeReminder
   */
  const snoozeReminderMutation = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      reminderService.snoozeReminder(id, minutes),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(reminderKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.today() });
    },
  });

  /**
   * ✅ Skip a reminder (mark as missed)
   * Nouvelle mutation pour ignorer un rappel
   */
  const skipReminderMutation = useMutation({
    mutationFn: (id: string) => reminderService.skipReminder(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(reminderKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: reminderKeys.today() });
    },
  });

  /**
   * ✅ Récupérer un rappel depuis le cache (pas d'appel API)
   * Utilise les données déjà chargées dans le cache
   */
  const getReminderFromCache = (
    reminderId: string,
  ): ReminderResponse | undefined => {
    // Récupérer les données du cache pour la liste des rappels
    const queryKey = reminderKeys.list(query);
    const cachedData = queryClient.getQueryData<{
      items: ReminderResponse[];
      pagination: any;
      summary: any;
    }>(queryKey);

    if (!cachedData) return undefined;
    return cachedData.items.find((r) => String(r.id) === reminderId);
  };

  /**
   * Create multiple reminders at once
   * La notification est gérée par reminderService.createBulkReminders
   */
  const createBulkRemindersMutation = useMutation({
    mutationFn: ({
      patientId,
      reminders,
    }: {
      patientId: string;
      reminders: Omit<CreateReminderRequest, "patientId">[];
    }) => reminderService.createBulkReminders(patientId, reminders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });

  /**
   * Récupérer un rappel par ID (soit du cache, soit avec une requête si nécessaire)
   * Mais ici on n'a pas d'endpoint individuel, donc on utilise le cache
   */
  const getReminder = async (id: string): Promise<ReminderResponse> => {
    // Essayer de récupérer depuis le cache
    const cached = getReminderFromCache(id);
    if (cached) {
      return cached;
    }

    // Si pas en cache, on rafraîchit la liste
    await queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
    const newData = await queryClient.fetchQuery({
      queryKey: reminderKeys.list(query),
      queryFn: async () => {
        const result = await reminderService.getReminders(query);
        return {
          items: result.items || [],
          pagination: result.pagination || {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
          },
          summary: result.summary || { pending: 0, taken: 0, missed: 0 },
        };
      },
    });

    const found = newData.items.find((r: { id: any }) => String(r.id) === id);
    if (found) {
      return found;
    }

    throw new Error(`Rappel avec l'ID ${id} non trouvé`);
  };

  /**
   * Mark specific reminders as read
   */
  const markAsReadMutation = useMutation({
    mutationFn: (reminderIds: string[]) =>
      reminderService.markAsRead(reminderIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
    },
  });

  /**
   * Mark all reminders as read
   */
  const markAllAsReadMutation = useMutation({
    mutationFn: () => reminderService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() });
    },
  });

  /**
   * ✅ Annuler tous les rappels pour un médicament
   */
  const cancelRemindersForMedication = async (medicationId: string) => {
    await reminderService.cancelRemindersForMedication(medicationId);
    queryClient.invalidateQueries({ queryKey: reminderKeys.all });
  };

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // Queries
    reminders: remindersQuery.data?.items || [],
    pagination: remindersQuery.data?.pagination || null,
    summary: summaryQuery.data || remindersQuery.data?.summary || { pending: 0, taken: 0, missed: 0 },
    isLoading: remindersQuery.isLoading,
    isFetching: remindersQuery.isFetching,
    error: remindersQuery.error,
    refetch: remindersQuery.refetch,

    // Individual query hooks (to be used in components)
    useSummary,
    useUpcomingReminders,
    useTodayReminders,
    usePatientReminders,
    useMedicationReminders,
    getReminder,
    getReminderFromCache,

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

    // ✅ Skip reminder mutation
    skipReminder: skipReminderMutation.mutate,
    skipReminderAsync: skipReminderMutation.mutateAsync,
    isSkipping: skipReminderMutation.isPending,
    skipError: skipReminderMutation.error,

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

    // ✅ Cancel reminders for medication
    cancelRemindersForMedication,
  };
};
