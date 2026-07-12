import { create } from "zustand";
import { appointmentService } from "../services/appointment.service";
import type { AppointmentResponse } from "../types/api-responses";
import type {
  CreateAppointmentRequest,
  CancelAppointmentRequest,
  RescheduleAppointmentRequest,
  AppointmentsListQuery
} from "../types/api-requests";

const CACHE_TTL = 5 * 60 * 1000;

interface AppointmentState {
  appointments: AppointmentResponse[];
  upcomingAppointments: AppointmentResponse[];
  todayAppointments: AppointmentResponse[];
  selectedAppointment: AppointmentResponse | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;

  // Actions
  fetchAppointments: (query?: AppointmentsListQuery) => Promise<void>;
  fetchUpcoming: () => Promise<void>;
  fetchToday: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: CreateAppointmentRequest) => Promise<void>;
  cancel: (id: string, data: CancelAppointmentRequest) => Promise<void>;
  reschedule: (id: string, data: RescheduleAppointmentRequest) => Promise<void>;
  clearError: () => void;
  setSelected: (appointment: AppointmentResponse | null) => void;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  upcomingAppointments: [],
  todayAppointments: [],
  selectedAppointment: null,
  isLoading: false,
  error: null,
  lastFetch: null,

  fetchAppointments: async (query) => {
    const state = get();
    if (state.appointments.length > 0 && state.isLoading) return;
    if (state.appointments.length > 0 && state.lastFetch && Date.now() - state.lastFetch < CACHE_TTL) return;
    if (!state.appointments.length) set({ isLoading: true, error: null });
    try {
      const appointments = await appointmentService.getAppointments(query);
      set({ appointments, lastFetch: Date.now() });
    } catch (e: any) {
      if (!state.appointments.length) set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUpcoming: async () => {
    set({ isLoading: true, error: null });
    try {
      const appointments = await appointmentService.getUpcomingAppointments();
      set({ upcomingAppointments: appointments, lastFetch: Date.now() });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchToday: async () => {
    set({ isLoading: true, error: null });
    try {
      const appointments = await appointmentService.getTodayAppointments();
      set({ todayAppointments: appointments, lastFetch: Date.now() });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const appointment = await appointmentService.getAppointmentById(id);
      set({ selectedAppointment: appointment });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  create: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newAppointment = await appointmentService.createAppointment(data);
      set((state) => ({
        appointments: [newAppointment, ...state.appointments],
        upcomingAppointments: [newAppointment, ...state.upcomingAppointments],
        lastFetch: Date.now(),
      }));
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  cancel: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await appointmentService.cancelAppointment(id, data);
      await get().fetchAppointments();
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  reschedule: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await appointmentService.rescheduleAppointment(id, data);
      set((state) => ({
        appointments: state.appointments.map(a => a.id === id ? updated : a),
        upcomingAppointments: state.upcomingAppointments.map(a => a.id === id ? updated : a),
        selectedAppointment: state.selectedAppointment?.id === id ? updated : state.selectedAppointment,
        lastFetch: Date.now(),
      }));
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  setSelected: (selectedAppointment) => set({ selectedAppointment }),
}));
