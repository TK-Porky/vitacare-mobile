import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { medicationService } from "../services/medication.service";
import { StoreMedicationResponse } from "../types/api-responses";

const CACHE_TTL = 5 * 60 * 1000;
const STALE_TTL = 24 * 60 * 60 * 1000;

interface MedicationState {
  medications: StoreMedicationResponse[];
  isLoading: boolean;
  error: string | null;
  searchResults: StoreMedicationResponse[];
  isSearching: boolean;
  lastFetch: number | null;

  fetchMedications: (params?: { searchQuery?: string; page?: number; size?: number }) => Promise<void>;
  fetchMedicationDetails: (id: string) => Promise<StoreMedicationResponse | null>;
  searchMedications: (query: string, filters?: { page?: number; size?: number }) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set, get) => ({
      medications: [],
      isLoading: false,
      error: null,
      searchResults: [],
      isSearching: false,
      lastFetch: null,

      fetchMedications: async (params?) => {
        const state = get();
        if (!params && state.medications.length > 0 && state.isLoading) return;
        if (!params && state.medications.length > 0 && state.lastFetch && Date.now() - state.lastFetch < CACHE_TTL) return;
        if (!state.medications.length || params) set({ isLoading: true, error: null });
        try {
          const medications = await medicationService.getStoreMedications(params);
          set({ medications, lastFetch: Date.now(), error: null });
        } catch (e: any) {
          if (!state.medications.length) set({ error: e.message || "Failed to fetch medications" });
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
          lastFetch: null,
        });
      },
    }),
    {
      name: "vitacare-medications",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        medications: state.medications,
        lastFetch: state.lastFetch,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.lastFetch && Date.now() - state.lastFetch > STALE_TTL) {
          state.medications = [];
          state.lastFetch = null;
        }
      },
    },
  ),
);
