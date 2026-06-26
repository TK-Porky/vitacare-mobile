import { apiClient } from "../lib/api.client";
import { API_ENDPOINTS } from "../types/api-endpoints";
import { SearchRequest } from "../types/api-requests";
import { ClinicProviderResponse } from "../types/api-responses";

/**
 * Posts/Discovery Service
 * Handles global search, clinic discovery and related content.
 */
export const postsService = {
  /**
   * Perform a global search for clinics, doctors, or specialties
   */
  async globalSearch(data: SearchRequest): Promise<any> {
    const res = await apiClient.post(API_ENDPOINTS.SEARCH.GLOBAL, data);
    if (!res.success) throw new Error(res.error ?? "Failed to perform search");
    return res.data;
  },

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    const res = await apiClient.get<string[]>(API_ENDPOINTS.SEARCH.SUGGESTIONS, { query });
    if (!res.success) throw new Error(res.error ?? "Failed to fetch suggestions");
    return res.data!;
  },

  /**
   * Get list of featured or popular clinics
   */
  async getFeaturedClinics(): Promise<ClinicProviderResponse[]> {
    // Using search endpoint to get featured clinics if no dedicated endpoint exists
    const res = await apiClient.get<ClinicProviderResponse[]>(API_ENDPOINTS.SEARCH.CLINICS, { featured: true });
    if (!res.success) throw new Error(res.error ?? "Failed to fetch featured clinics");
    return res.data!;
  }
};
