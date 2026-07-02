import { apiClient } from "@/lib/api.client";
import { API_ENDPOINTS } from "@/types/api-endpoints";
import {
  CreateReminderRequest,
  CreateSimpleReminderRequest,
  UpdateReminderRequest,
  RemindersListQuery,
} from "@/types/api-requests";
import { ReminderResponse, RemindersListResponse } from "@/types/api-responses";
import { notificationService } from "./notifications";

// ── Helper functions ───────────────────────────────────────────────────────

// Construit une chaîne de requête URL
const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

// ── Service ───────────────────────────────────────────────────────────────

export const reminderService = {
  // ── Requêtes API ───────────────────────────────────────────────────────────

  // Récupère tous les rappels avec pagination et filtrage
  async getReminders(query?: RemindersListQuery) {
    const params = new URLSearchParams();
    if (query?.status) params.append("status", query.status);
    if (query?.page) params.append("page", String(query.page));
    if (query?.limit) params.append("limit", String(query.limit));
    if (query?.patientId) params.append("patientId", String(query.patientId));
    if (query?.medicationId)
      params.append("medicationId", String(query.medicationId));

    const url = params.toString()
      ? `${API_ENDPOINTS.REMINDERS.LIST}?${params.toString()}`
      : API_ENDPOINTS.REMINDERS.LIST;

    const response = await apiClient.get(url);

    console.log("[reminderService] Raw response:", response);

    const data = response.data;

    if (Array.isArray(data)) {
      return {
        items: data,
        pagination: {
          total: data.length,
          page: 1,
          limit: data.length || 20,
          totalPages: 1,
        },
        summary: {
          pending: data.filter((r) => r.status === "PENDING").length,
          taken: data.filter((r) => r.status === "TAKEN").length,
          missed: data.filter((r) => r.status === "MISSED").length,
        },
      };
    }

    if (data?.data && Array.isArray(data.data)) {
      const items = data.data;
      return {
        items: items,
        pagination: {
          total: data.total || items.length,
          page: data.page || 1,
          limit: data.limit || 20,
          totalPages: data.totalPages || 1,
        },
        summary: {
          pending: items.filter(
            (r: { status: string }) => r.status === "PENDING",
          ).length,
          taken: items.filter((r: { status: string }) => r.status === "TAKEN")
            .length,
          missed: items.filter((r: { status: string }) => r.status === "MISSED")
            .length,
        },
      };
    }

    return {
      items: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      summary: { pending: 0, taken: 0, missed: 0 },
    };
  },

  // Crée un nouveau rappel lié à un médicament existant (par medicationId)
  async createReminder(data: CreateReminderRequest): Promise<ReminderResponse> {
    const res = await apiClient.post<ReminderResponse>(
      API_ENDPOINTS.REMINDERS.CREATE,
      data,
    );
    if (!res.success) throw new Error(res.error ?? "Failed to create reminder");
    const reminder = res.data!;

    // Utiliser scheduleTreatmentReminder (qui utilise la méthode schedule qui fonctionne)
    if (data.scheduledDate && data.scheduledTime) {
      let scheduledDate = new Date(
        data.scheduledDate + "T" + data.scheduledTime,
      );
      if (scheduledDate <= new Date()) {
        console.warn("⏰ Date de rappel passée, reprogrammation dans 1 minute");
        scheduledDate = new Date(Date.now() + 60000);
      }
      console.log(
        `📅 Planification du rappel ${data.medicationName} à ${scheduledDate.toISOString()}`,
      );
      await notificationService.scheduleTreatmentReminder({
        treatmentId: String(reminder.id),
        treatmentName: data.medicationName || "Médicament",
        reminderTime: scheduledDate,
      });
    } else {
      console.warn(
        "⚠️ scheduledDate ou scheduledHour manquant dans la réponse",
      );
    }
    return reminder;
  },

  // Crée un rappel simple par nom de médicament (résolution automatique ou création de médicament)
  // Planifie la notification
  async createSimpleReminder(
    data: CreateSimpleReminderRequest,
  ): Promise<ReminderResponse> {
    const res = await apiClient.post<ReminderResponse>(
      API_ENDPOINTS.DASHBOARD.ADD_MEDICATION,
      data,
    );
    if (!res.success)
      throw new Error(res.error ?? "Failed to create simple reminder");

    const reminder = res.data!;

    // Planifier la notification de rappel
    if (data.startDate && data.times) {
      const scheduledDate = new Date(data.startDate + "T" + data.times);

      if (scheduledDate > new Date()) {
        await notificationService.scheduleTreatmentReminder({
          treatmentId: String(reminder.id),
          treatmentName: data.name || "Médicament",
          reminderTime: scheduledDate,
        });
      }
    }

    return reminder;
  },

  // Met à jour un rappel existant
  // Reprogramme la notification
  async updateReminder(
    reminderId: string,
    data: UpdateReminderRequest,
  ): Promise<ReminderResponse> {
    const res = await apiClient.put<ReminderResponse>(
      API_ENDPOINTS.REMINDERS.UPDATE(reminderId),
      data,
    );
    if (!res.success) throw new Error(res.error ?? "Failed to update reminder");
    const reminder = res.data!;

    // Annuler l'ancienne notification
    await notificationService.cancelNotification(reminderId);

    // Reprogrammer avec scheduleTreatmentReminder
    if (data.scheduledDate && data.scheduledTime) {
      let scheduledDate = new Date(
        data.scheduledDate + "T" + data.scheduledTime,
      );
      if (scheduledDate <= new Date()) {
        scheduledDate = new Date(Date.now() + 60000);
      }
      await notificationService.scheduleTreatmentReminder({
        treatmentId: String(reminder.id),
        treatmentName:
          data.medicationName || reminder.medicationName || "Médicament",
        reminderTime: scheduledDate,
      });
    }
    return reminder;
  },

  // Supprime un rappel
  // Annule la notification
  async deleteReminder(reminderId: string): Promise<void> {
    const res = await apiClient.delete(
      API_ENDPOINTS.REMINDERS.DELETE(reminderId),
    );
    if (!res.success) throw new Error(res.error ?? "Failed to delete reminder");
    // Annuler la notification
    await notificationService.cancelNotification(reminderId);
  },

  // Marque un rappel comme pris (confirme la prise)
  // Annule la notification après prise
  async markAsTaken(
    reminderId: string,
    takenAt?: string,
  ): Promise<ReminderResponse> {
    const res = await apiClient.post<ReminderResponse>(
      API_ENDPOINTS.REMINDERS.MARK_TAKEN,
      { reminderId, takenAt },
    );
    if (!res.success) throw new Error(res.error ?? "Failed to mark as taken");
    // Annuler la notification
    await notificationService.cancelNotification(reminderId);
    return res.data!;
  },

  // Snooze un rappel pour une durée spécifiée (minutes)
  // Reprogramme la notification après snooze
  async snoozeReminder(
    reminderId: string,
    minutes: number,
  ): Promise<ReminderResponse> {
    const res = await apiClient.post<ReminderResponse>(
      API_ENDPOINTS.REMINDERS.SNOOZE,
      { reminderId, minutes },
    );
    if (!res.success) throw new Error(res.error ?? "Failed to snooze reminder");
    const reminder = res.data!;

    await notificationService.cancelNotification(reminderId);

    if (reminder.scheduledDate && reminder.scheduledHour) {
      let scheduledDate = new Date(
        reminder.scheduledDate + "T" + reminder.scheduledHour,
      );
      if (scheduledDate <= new Date()) {
        scheduledDate = new Date(Date.now() + 60000);
      }
      await notificationService.scheduleTreatmentReminder({
        treatmentId: String(reminder.id),
        treatmentName: reminder.medicationName || "Médicament",
        reminderTime: scheduledDate,
      });
    }
    return reminder;
  },

  // Skip un rappel (marque comme manqué sans notification)
  // Annule la notification
  async skipReminder(reminderId: string): Promise<ReminderResponse> {
    const res = await apiClient.post<ReminderResponse>(
      API_ENDPOINTS.REMINDERS.SKIP,
      { reminderId },
    );
    if (!res.success) throw new Error(res.error ?? "Failed to skip reminder");

    // Annuler la notification après skip
    await notificationService.cancelNotification(reminderId);

    return res.data!;
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────

  // Récupère les prochains rappels (prochaines 24 heures)
  async getUpcomingReminders(): Promise<RemindersListResponse> {
    const res = await apiClient.get<RemindersListResponse>(
      API_ENDPOINTS.REMINDERS.UPCOMING,
    );
    if (!res.success)
      throw new Error(res.error ?? "Failed to fetch upcoming reminders");
    return res.data!;
  },

  // Récupère les prochains rappels (prochaines 24 heures)
  async getTodaySchedule(): Promise<RemindersListResponse> {
    const res = await apiClient.get<RemindersListResponse>(
      API_ENDPOINTS.REMINDERS.TODAY,
    );
    if (!res.success)
      throw new Error(res.error ?? "Failed to fetch today's schedule");
    return res.data!;
  },

  // Récupère les statistiques des rappels
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
    if (!res.success)
      throw new Error(res.error ?? "Failed to fetch reminder summary");
    return res.data!;
  },

  // ── Listes ───────────────────────────────────────────────────────────────

  // Récupère les rappels d'un patient spécifique
  async getPatientReminders(
    patientId: string,
    query?: RemindersListQuery,
  ): Promise<RemindersListResponse> {
    const queryString = buildQueryString(query);
    const url = `${API_ENDPOINTS.REMINDERS.PATIENT(patientId)}${queryString}`;

    const res = await apiClient.get<RemindersListResponse>(url);
    if (!res.success)
      throw new Error(res.error ?? "Failed to fetch patient reminders");
    return res.data!;
  },

  // Récupère les rappels d'un médicament spécifique
  async getMedicationReminders(
    medicationId: string,
    query?: RemindersListQuery,
  ): Promise<RemindersListResponse> {
    const queryString = buildQueryString(query);
    const url = `${API_ENDPOINTS.REMINDERS.MEDICATION(medicationId)}${queryString}`;

    const res = await apiClient.get<RemindersListResponse>(url);
    if (!res.success)
      throw new Error(res.error ?? "Failed to fetch medication reminders");
    return res.data!;
  },

  // Crée plusieurs rappels en même temps
  // Planifie les notifications pour chaque rappel
  async createBulkReminders(
    patientId: string,
    reminders: Omit<CreateReminderRequest, "patientId">[],
  ): Promise<ReminderResponse[]> {
    const res = await apiClient.post<{ reminders: ReminderResponse[] }>(
      API_ENDPOINTS.REMINDERS.BULK_CREATE,
      { patientId, reminders },
    );
    if (!res.success)
      throw new Error(res.error ?? "Failed to create bulk reminders");

    const createdReminders = res.data!.reminders;

    // Planifier les notifications pour chaque rappel
    for (let i = 0; i < createdReminders.length; i++) {
      const reminder = createdReminders[i];
      const originalData = reminders[i];

      if (originalData.scheduledDate && originalData.scheduledTime) {
        let scheduledDate = new Date(
          originalData.scheduledDate + "T" + originalData.scheduledTime,
        );
        if (scheduledDate <= new Date()) {
          scheduledDate = new Date(Date.now() + 60000);
        }
        await notificationService.scheduleTreatmentReminder({
          treatmentId: String(reminder.id),
          treatmentName: originalData.medicationName || "Médicament",
          reminderTime: scheduledDate,
        });
      }
    }

    return createdReminders;
  },

  // ── Notifications ───────────────────────────────────────────────────────────────

  // Marque un rappel comme lus
  async markAsRead(reminderIds: string[]): Promise<void> {
    const res = await apiClient.post(API_ENDPOINTS.REMINDERS.MARK_READ, {
      reminderIds,
    });
    if (!res.success)
      throw new Error(res.error ?? "Failed to mark reminders as read");
  },

  // Marque tous les rappels comme lus
  async markAllAsRead(): Promise<void> {
    const res = await apiClient.post(API_ENDPOINTS.REMINDERS.MARK_ALL_READ);
    if (!res.success)
      throw new Error(res.error ?? "Failed to mark all reminders as read");
  },

  // Annule tous les rappels pour un médicament spécifique
  async cancelRemindersForMedication(medicationId: string): Promise<void> {
    try {
      const reminders = await this.getMedicationReminders(medicationId);

      for (const reminder of reminders.items) {
        await notificationService.cancelNotification(String(reminder.id));
      }

      console.log(
        `Tous les rappels annulés pour le médicament ${medicationId}`,
      );
    } catch (error) {
      console.error(`❌ Erreur lors de l'annulation des rappels:`, error);
    }
  },
};
