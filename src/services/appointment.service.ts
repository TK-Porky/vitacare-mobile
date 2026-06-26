import { apiClient } from "../lib/api.client";
import { API_ENDPOINTS } from "../types/api-endpoints";
import type {
  AppointmentsListQuery,
  CreateAppointmentRequest,
  CancelAppointmentRequest,
  RescheduleAppointmentRequest,
} from "../types/api-requests";
import type {
  AppointmentResponse,
} from "../types/api-responses";

function unwrapBackendData<T>(res: any): T {
  if (!res.success) throw new Error(res.error ?? "Request failed");
  const body = res.data;
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

async function listAppointments(query?: AppointmentsListQuery): Promise<AppointmentResponse[]> {
  let endpoint = API_ENDPOINTS.APPOINTMENTS.LIST;
  if (query) {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('size', String(query.limit));
    if (query.status) params.set('status', query.status.toUpperCase());
    if (query.startDate) params.set('from', query.startDate);
    if (query.endDate) params.set('to', query.endDate);
    if (query.providerId) params.set('doctorId', String(query.providerId));
    endpoint += '?' + params.toString();
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
    const res = await apiClient.post<any>(API_ENDPOINTS.APPOINTMENTS.CREATE, payload);
    return unwrapBackendData<AppointmentResponse>(res);
  },

  async cancel(id: number | string, reason?: string): Promise<void> {
    const res = await apiClient.patch(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), { cancellationReason: reason ?? '' });
    if (!res.success) throw new Error(res.error ?? "Failed to cancel appointment");
  },

  async reschedule(id: number | string, data: RescheduleAppointmentRequest): Promise<AppointmentResponse> {
    const startTime = `${data.newDate}T${data.newTime}:00`;
    const endDateTime = new Date(new Date(startTime).getTime() + 30 * 60 * 1000);
    const newEndTime = endDateTime.toISOString().slice(0, 19);
    const payload = {
      newStartTime: startTime,
      newEndTime,
      reason: data.reason ?? '',
    };
    const res = await apiClient.patch<any>(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), payload);
    return unwrapBackendData<AppointmentResponse>(res);
  },

  // ── Store-compatible aliases ────────────────────────────────────────

  async getAppointments(query?: AppointmentsListQuery): Promise<AppointmentResponse[]> {
    return listAppointments(query);
  },

  async getUpcomingAppointments(): Promise<AppointmentResponse[]> {
    const all = await listAppointments();
    const now = new Date().toISOString();
    return all.filter(a => a.status === 'CONFIRMED' && a.dateTime > now);
  },

  async getTodayAppointments(): Promise<AppointmentResponse[]> {
    const all = await listAppointments();
    const today = new Date().toISOString().split('T')[0];
    return all.filter(a => a.date === today);
  },

  async getAppointmentById(id: number | string): Promise<AppointmentResponse> {
    const res = await apiClient.get<any>(API_ENDPOINTS.APPOINTMENTS.DETAIL(id));
    return unwrapBackendData<AppointmentResponse>(res);
  },

  async createAppointment(data: CreateAppointmentRequest): Promise<AppointmentResponse> {
    const payload = {
      doctorId: Number(data.providerId),
      dateTime: `${data.date}T${data.time}:00`,
      reason: data.reason,
      paymentMethod: data.paymentMethod,
    };
    const res = await apiClient.post<any>(API_ENDPOINTS.APPOINTMENTS.CREATE, payload);
    return unwrapBackendData<AppointmentResponse>(res);
  },

  async cancelAppointment(id: number | string, data: CancelAppointmentRequest): Promise<void> {
    const res = await apiClient.patch(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), { cancellationReason: data.reason ?? '' });
    if (!res.success) throw new Error(res.error ?? "Failed to cancel appointment");
  },

  async rescheduleAppointment(id: number | string, data: RescheduleAppointmentRequest): Promise<AppointmentResponse> {
    const startTime = `${data.newDate}T${data.newTime}:00`;
    const endDateTime = new Date(new Date(startTime).getTime() + 30 * 60 * 1000);
    const newEndTime = endDateTime.toISOString().slice(0, 19);
    const payload = {
      newStartTime: startTime,
      newEndTime,
      reason: data.reason ?? '',
    };
    const res = await apiClient.patch<any>(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), payload);
    return unwrapBackendData<AppointmentResponse>(res);
  },
};
