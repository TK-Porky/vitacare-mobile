import { create } from "zustand";
import { dashboardService } from "../services/dashboard.service";
import { DashboardResponse, DashboardStatsResponse } from "../types/api-responses";
import { DashboardQuery, UpdateMedicationStatusRequest, UpdateObservanceRequest } from "../types/api-requests";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface DashboardState {
  data: DashboardResponse['data'] | null;
  stats: DashboardStatsResponse | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;

  // Actions
  fetchOverview: (query?: DashboardQuery) => Promise<void>;
  fetchStats: () => Promise<void>;
  updateMedicationStatus: (data: UpdateMedicationStatusRequest) => Promise<void>;
  updateObservance: (data: UpdateObservanceRequest) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  stats: null,
  isLoading: false,
  error: null,
  lastFetch: null,

  fetchOverview: async (query) => {
    const state = get();
    if (state.data && state.isLoading) return;
    if (state.data && state.lastFetch && Date.now() - state.lastFetch < CACHE_TTL) return;

    if (!state.data) set({ isLoading: true, error: null });
    try {
      const data = await dashboardService.getOverview(query);
      set({ data, lastFetch: Date.now() });
    } catch (e: any) {
      if (!state.data) set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await dashboardService.getStats();
      set({ stats, lastFetch: Date.now() });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateMedicationStatus: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await dashboardService.updateMedicationStatus(data);
      await get().fetchOverview();
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  updateObservance: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await dashboardService.updateObservance(data);
      await get().fetchOverview();
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
