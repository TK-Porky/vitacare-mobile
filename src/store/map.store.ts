import { create } from "zustand";
import { mapService } from "../services/map.service";
import { ClinicProviderResponse } from "../types/api-responses";
import { ClinicSearchRequest, ClinicsListQuery } from "../types/api-requests";

interface MapState {
  clinics: ClinicProviderResponse[];
  searchResults: ClinicProviderResponse[];
  selectedClinic: ClinicProviderResponse | null;
  isLoading: boolean;
  error: string | null;

  // Pagination
  page: number;
  totalPages: number;
  hasMore: boolean;

  // Actions
  fetchClinics: (query?: ClinicsListQuery) => Promise<void>;
  fetchMoreClinics: (query?: ClinicsListQuery) => Promise<void>;
  searchClinics: (data: ClinicSearchRequest) => Promise<void>;
  fetchClinicById: (id: string) => Promise<void>;
  setSelectedClinic: (clinic: ClinicProviderResponse | null) => void;
  clearError: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  clinics: [],
  searchResults: [],
  selectedClinic: null,
  isLoading: false,
  error: null,
  
  page: 1,
  totalPages: 1,
  hasMore: false,

  fetchClinics: async (query) => {
    set({ isLoading: true, error: null, page: 1 });
    try {
      const response = await mapService.getClinics({ ...query, page: 1 });
      set({ 
        clinics: response.data ?? [],
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.page < response.pagination.totalPages
      });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMoreClinics: async (query) => {
    const { page, totalPages, isLoading, hasMore } = get();
    if (isLoading || !hasMore) return;

    const nextPage = page + 1;
    set({ isLoading: true });
    
    try {
      const response = await mapService.getClinics({ ...query, page: nextPage });
      set({ 
        clinics: [...get().clinics, ...(response.data ?? [])],
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.page < response.pagination.totalPages
      });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  searchClinics: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const results = await mapService.searchClinics(data);
      set({ searchResults: results });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchClinicById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const clinic = await mapService.getClinicDetails(id);
      set({ selectedClinic: clinic });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedClinic: (selectedClinic) => set({ selectedClinic }),
  clearError: () => set({ error: null }),
}));
