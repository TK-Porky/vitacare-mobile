import { create } from "zustand";
import { medicationService } from "../services/medication.service";
import { StoreMedicationResponse } from "../types/api-responses";

interface MedicationState {
  medications: StoreMedicationResponse[];
  isLoading: boolean;
  error: string | null;
  searchResults: StoreMedicationResponse[];
  isSearching: boolean;

  fetchMedications: (params?: { searchQuery?: string; page?: number; size?: number }) => Promise<void>;
  fetchMedicationDetails: (id: string) => Promise<StoreMedicationResponse | null>;
  searchMedications: (query: string, filters?: { page?: number; size?: number }) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useMedicationStore = create<MedicationState>((set) => ({
  medications: [],
  isLoading: false,
  error: null,
  searchResults: [],
  isSearching: false,

  fetchMedications: async (params?) => {
    set({ isLoading: true, error: null });
    try {
      const medications = await medicationService.getStoreMedications(params);
      set({ medications, error: null });
    } catch (e: any) {
      set({ error: e.message || "Failed to fetch medications" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMedicationDetails: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const medication = await medicationService.getStoreMedication(id);
      return medication;
    } catch (e: any) {
      set({ error: e.message || "Failed to fetch medication details" });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  searchMedications: async (query: string, filters?) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true, isLoading: true, error: null });
    try {
      const result = await medicationService.searchMedications(query, filters);
      set({ searchResults: result || [], isSearching: true, error: null });
    } catch (e: any) {
      set({ error: e.message || "Failed to search medications", searchResults: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], isSearching: false, error: null });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      medications: [],
      isLoading: false,
      error: null,
      searchResults: [],
      isSearching: false,
    });
  },
}));
