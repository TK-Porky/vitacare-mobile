import { create } from "zustand";
import { dashboardService } from "../services/dashboard.service";
import { DashboardResponse, DashboardStatsResponse } from "../types/api-responses";
import { DashboardQuery, UpdateMedicationStatusRequest, UpdateObservanceRequest } from "../types/api-requests";

interface DashboardState {
  data: DashboardResponse['data'] | null;
  stats: DashboardStatsResponse | null;
  isLoading: boolean;
  error: string | null;

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

  fetchOverview: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const data = await dashboardService.getOverview(query);
      set({ data });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await dashboardService.getStats();
      set({ stats });
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
      // Refresh data after update
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
      // Refresh data after update
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
