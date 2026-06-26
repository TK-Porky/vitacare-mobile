import { apiClient } from "../lib/api.client";
import { API_ENDPOINTS } from "../types/api-endpoints";
import { StoreMedicationResponse, MedicationDetailResponse } from "../types/api-responses";

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

export const medicationService = {
  async getStoreMedications(params?: {
    searchQuery?: string;
    page?: number;
    size?: number;
  }): Promise<StoreMedicationResponse[]> {
    const queryString = buildQueryString(params);
    const url = `${API_ENDPOINTS.MEDICATIONS.LIST}${queryString}`;
    const res = await apiClient.get<StoreMedicationResponse[]>(url);
    if (!res.success) throw new Error(res.error ?? "Failed to fetch medications");
    return res.data ?? [];
  },

  async getStoreMedication(id: string): Promise<MedicationDetailResponse> {
    const res = await apiClient.get<MedicationDetailResponse>(
      API_ENDPOINTS.MEDICATIONS.GET(id)
    );
    if (!res.success) throw new Error(res.error ?? "Failed to fetch medication details");
    return res.data!;
  },

  async getMedicationForms(id: string): Promise<MedicationDetailResponse> {
    const res = await apiClient.get<MedicationDetailResponse>(
      API_ENDPOINTS.MEDICATIONS.FORMS(id)
    );
    if (!res.success) throw new Error(res.error ?? "Failed to fetch medication details");
    return res.data!;
  },

  async searchMedications(
    query: string,
    filters?: { page?: number; size?: number }
  ): Promise<StoreMedicationResponse[]> {
    const params = { q: query, ...filters };
    const queryString = buildQueryString(params);
    const url = `${API_ENDPOINTS.MEDICATIONS.SEARCH}${queryString}`;
    const res = await apiClient.get<StoreMedicationResponse[]>(url);
    if (!res.success) throw new Error(res.error ?? "Failed to search medications");
    return res.data ?? [];
  },

  async getMedicationsByCategory(category: string): Promise<StoreMedicationResponse[]> {
    const queryString = buildQueryString({ searchQuery: category });
    const url = `${API_ENDPOINTS.MEDICATIONS.LIST}${queryString}`;
    const res = await apiClient.get<StoreMedicationResponse[]>(url);
    if (!res.success) throw new Error(res.error ?? "Failed to fetch medications by category");
    return res.data ?? [];
  },
};
