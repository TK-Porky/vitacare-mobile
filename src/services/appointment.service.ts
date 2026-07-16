import { apiClient } from "@/lib/api.client";
import { API_ENDPOINTS } from "@/types/api-endpoints";
import type {
  AppointmentsListQuery,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
} from "@/types/api-requests";
import type { AppointmentResponse } from "@/types/api-responses";

function unwrapBackendData<T>(res: any): T {
  if (!res.success) throw new Error(res.error ?? "Request failed");
  const body = res.data;
  if (body && typeof body === "object" && "data" in body) {
    return body.data as T;
  }
  return body as T;
}

async function listAppointments(
  query?: AppointmentsListQuery,
): Promise<AppointmentResponse[]> {
  let endpoint = API_ENDPOINTS.APPOINTMENTS.LIST;
  if (query) {
    const params = new URLSearchParams();
    if (query.page != null) params.set("page", String(query.page));
    if (query.limit != null) params.set("size", String(query.limit));
    if (query.status) params.set("status", query.status.toUpperCase());
    if (query.startDate) params.set("from", query.startDate);
    if (query.endDate) params.set("to", query.endDate);
    if (query.providerId) params.set("doctorId", String(query.providerId));
    endpoint += "?" + params.toString();
  }
  const res = await apiClient.get<any>(endpoint);
  return unwrapBackendData<AppointmentResponse[]>(res);
}

export const appointmentService = {
  async getAll(query?: AppointmentsListQuery): Promise<AppointmentResponse[]> {
    return listAppointments(query);
  },

  async getById(id: number | string): Promise<AppointmentResponse> {
    const res = await apiClient.get<any>(API_ENDPOINTS.APPOINTMENTS.DETAIL(id));
    return unwrapBackendData<AppointmentResponse>(res);
  },

  async create(data: CreateAppointmentRequest): Promise<AppointmentResponse> {
    const payload = {
      doctorId: Number(data.providerId),
      dateTime: `${data.date}T${data.time}:00`,
      reason: data.reason,
      paymentMethod: data.paymentMethod,
    };
    const res = await apiClient.post<any>(
      API_ENDPOINTS.APPOINTMENTS.CREATE,
      payload,
    );
    return unwrapBackendData<AppointmentResponse>(res);
  },

  async cancel(id: number | string): Promise<void> {
    const res = await apiClient.delete(API_ENDPOINTS.APPOINTMENTS.CANCEL(id));
    if (!res.success)
      throw new Error(res.error ?? "Failed to cancel appointment");
  },

  async reschedule(
    id: number | string,
    data: RescheduleAppointmentRequest,
  ): Promise<AppointmentResponse> {
    const startTime = `${data.newDate}T${data.newTime}:00`;
    const [sh, sm] = data.newTime.split(":").map(Number);
    const m = sh * 60 + sm + 30;
    const eh = Math.floor(m / 60) % 24;
    const em = m % 60;
    const newEndTime = `${data.newDate}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`;
    const payload = {
      newStartTime: startTime,
      newEndTime,
      reason: data.reason ?? "",
    };
    const res = await apiClient.patch<any>(
      API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id),
      payload,
    );
    return unwrapBackendData<AppointmentResponse>(res);
  },

  // ── Store-compatible aliases ────────────────────────────────────────

  async getAppointments(
    query?: AppointmentsListQuery,
  ): Promise<AppointmentResponse[]> {
    return listAppointments(query);
  },

  async getUpcomingAppointments(): Promise<AppointmentResponse[]> {
    const all = await listAppointments();
    const now = new Date().toISOString();
    return all.filter((a) => a.status === "CONFIRMED" && a.dateTime > now);
  },

  async getTodayAppointments(): Promise<AppointmentResponse[]> {
    const all = await listAppointments();
    const today = new Date().toISOString().split("T")[0];
    return all.filter((a) => a.date === today);
  },

  async getAppointmentById(id: number | string): Promise<AppointmentResponse> {
    const res = await apiClient.get<any>(API_ENDPOINTS.APPOINTMENTS.DETAIL(id));
    return unwrapBackendData<AppointmentResponse>(res);
  },

  async createAppointment(
    data: CreateAppointmentRequest,
  ): Promise<AppointmentResponse> {
    const payload = {
      doctorId: Number(data.providerId),
      dateTime: `${data.date}T${data.time}:00`,
      reason: data.reason,
      paymentMethod: data.paymentMethod,
    };
    const res = await apiClient.post<any>(
      API_ENDPOINTS.APPOINTMENTS.CREATE,
      payload,
    );
    return unwrapBackendData<AppointmentResponse>(res);
  },

  async cancelAppointment(id: number | string): Promise<void> {
    const res = await apiClient.delete(API_ENDPOINTS.APPOINTMENTS.CANCEL(id));
    if (!res.success)
      throw new Error(res.error ?? "Failed to cancel appointment");
  },

  async deleteAppointment(id: number | string): Promise<void> {
    const res = await apiClient.delete(API_ENDPOINTS.APPOINTMENTS.DELETE(id));
    if (!res.success)
      throw new Error(res.error ?? "Failed to delete appointment");
  },

  async rescheduleAppointment(
    id: number | string,
    data: RescheduleAppointmentRequest,
  ): Promise<AppointmentResponse> {
    const startTime = `${data.newDate}T${data.newTime}:00`;
    const [sh, sm] = data.newTime.split(":").map(Number);
    const m = sh * 60 + sm + 30;
    const eh = Math.floor(m / 60) % 24;
    const em = m % 60;
    const newEndTime = `${data.newDate}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`;
    const payload = {
      newStartTime: startTime,
      newEndTime,
      reason: data.reason ?? "",
    };
    const res = await apiClient.patch<any>(
      API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id),
      payload,
    );
    return unwrapBackendData<AppointmentResponse>(res);
  },

  async markAsPaid(id: number | string): Promise<void> {
    const res = await apiClient.patch(API_ENDPOINTS.APPOINTMENTS.MARK_PAID(id));
    if (!res.success) {
      throw new Error(res.error ?? "Failed to mark appointment as paid");
    }
  },
};
