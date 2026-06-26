import { apiClient } from "../lib/api.client";
import { API_ENDPOINTS } from "../types/api-endpoints";
import { 
  DashboardQuery, 
  UpdateMedicationStatusRequest, 
  UpdateObservanceRequest,
  AddMedicationRequest 
} from "../types/api-requests";
import { DashboardResponse, DashboardStatsResponse } from "../types/api-responses";

// ================================================================================== //
// Dashboard Service
// Handles dashboard data, statistics and overview information.
// ================================================================================== //

export const dashboardService = {
  /**
   * Get dashboard overview data
   */
  async getOverview(query?: DashboardQuery): Promise<any> {
    const res = await apiClient.get<any>(API_ENDPOINTS.DASHBOARD.OVERVIEW, query as any);
    if (!res.success) throw new Error(res.error ?? "Failed to fetch dashboard overview");
    return res.data!;
  },

  async getStats(): Promise<DashboardStatsResponse> {
    const res = await apiClient.get<any>(API_ENDPOINTS.DASHBOARD.STATS);
    if (!res.success) throw new Error(res.error ?? "Failed to fetch dashboard stats");
    return (res.data! as any).stats;
  },

  /**
   * Add a new medication reminder
   */
  async addMedication(data: AddMedicationRequest): Promise<any> {
    const res = await apiClient.post<any>(API_ENDPOINTS.DASHBOARD.ADD_MEDICATION, data);
    if (!res.success) throw new Error(res.error ?? "Failed to add medication");
    return res.data;
  },

  /**
   * Update medication status (taken/missed) from dashboard
   */
  async updateMedicationStatus(data: UpdateMedicationStatusRequest): Promise<void> {
    const res = await apiClient.patch<any>(API_ENDPOINTS.DASHBOARD.UPDATE_MEDICATION(data.medicationId), data);
    if (!res.success) throw new Error(res.error ?? "Failed to update medication status");
  },

  /**
   * Remove a medication
   */
  async deleteMedication(medicationId: number): Promise<void> {
    const res = await apiClient.delete<any>(API_ENDPOINTS.DASHBOARD.DELETE_MEDICATION(medicationId));
    if (!res.success) throw new Error(res.error ?? "Failed to delete medication");
  },

  /**
   * Update observance status
   */
  async updateObservance(data: UpdateObservanceRequest): Promise<void> {
    const res = await apiClient.patch(API_ENDPOINTS.DASHBOARD.UPDATE_OBSERVANCE(data.observanceId), data);
    if (!res.success) throw new Error(res.error ?? "Failed to update observance");
  }
};
