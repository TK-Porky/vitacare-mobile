import i18next from "@/i18n";
import { create } from "zustand";
import { mapService } from "../services/map.service";
import { ClinicProviderResponse } from "../types/api-responses";
import { ClinicSearchRequest, ClinicsListQuery } from "../types/api-requests";

// ================================================================================== //
// Types
// ================================================================================== //

interface CacheEntry {
  data: ClinicProviderResponse[];
  timestamp: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  query?: ClinicsListQuery;
}

interface MapState {
  // Data
  clinics: ClinicProviderResponse[];
  searchResults: ClinicProviderResponse[];
  selectedClinic: ClinicProviderResponse | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isLoadingDetail: boolean;
  isSearching: boolean;
  isSearchingMore: boolean;

  // Pagination
  page: number;
  totalPages: number;
  hasMore: boolean;
  searchPage: number;
  searchTotalPages: number;
  searchHasMore: boolean;

  // Search
  searchQuery: string;
  searchFilters: ClinicSearchRequest["filters"];
  searchCoordinates: ClinicSearchRequest["coordinates"];

  // Error
  error: string | null;

  // Cache
  cache: Record<string, CacheEntry>;
  cacheTTL: number;

  // Actions
  fetchClinics: (query?: ClinicsListQuery, refresh?: boolean) => Promise<void>;
  fetchMoreClinics: (query?: ClinicsListQuery) => Promise<void>;
  searchClinics: (data: ClinicSearchRequest, reset?: boolean) => Promise<void>;
  searchMoreClinics: (data: ClinicSearchRequest) => Promise<void>;
  clearSearch: () => void;
  fetchClinicById: (id: string) => Promise<void>;
  setSelectedClinic: (clinic: ClinicProviderResponse | null) => void;
  clearError: () => void;
  clearCache: () => void;
  reset: () => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PAGE_SIZE = 20;

// ================================================================================== //
// Helpers
// ================================================================================== //

const generateCacheKey = (query?: ClinicsListQuery): string => {
  if (!query) return "default";
  return JSON.stringify(query);
};

// ================================================================================== //
// Store
// ================================================================================== //

export const useMapStore = create<MapState>((set, get) => ({
  // ── Data ──
  clinics: [],
  searchResults: [],
  selectedClinic: null,

  // ── Loading states ──
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  isLoadingDetail: false,
  isSearching: false,
  isSearchingMore: false,

  // ── Pagination ──
  page: 1,
  totalPages: 1,
  hasMore: false,
  searchPage: 1,
  searchTotalPages: 1,
  searchHasMore: false,

  // ── Search ──
  searchQuery: "",
  searchFilters: undefined,
  searchCoordinates: undefined,

  // ── Error ──
  error: null,

  // ── Cache ──
  cache: {},
  cacheTTL: CACHE_TTL,

  // ================================================================================== //
  // Actions
  // ================================================================================== //

  /**
   * Fetch clinics with pagination
   */
  fetchClinics: async (query, refresh = false) => {
    // Utiliser le cache si disponible et pas de refresh
    if (!refresh) {
      const cacheKey = generateCacheKey(query);
      const cached = get().cache[cacheKey];
      if (cached && Date.now() - cached.timestamp < get().cacheTTL) {
        set({
          clinics: cached.data,
          page: cached.page,
          totalPages: cached.totalPages,
          hasMore: cached.hasMore,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
        return;
      }
    }

    // Gérer les états de chargement
    if (refresh) {
      set({ isRefreshing: true, error: null, page: 1 });
    } else {
      set({ isLoading: true, error: null, page: 1 });
    }

    try {
      const response = await mapService.getClinics({
        ...query,
        page: 1,
        limit: query?.limit || DEFAULT_PAGE_SIZE,
      });

      // ✅ Vérifier la structure de la réponse
      const clinics = response.data ?? [];
      const pagination = response.pagination ?? { page: 1, totalPages: 1 };

      // Mettre à jour le cache
      const cacheKey = generateCacheKey(query);
      const cacheEntry: CacheEntry = {
        data: clinics,
        timestamp: Date.now(),
        page: pagination.page,
        totalPages: pagination.totalPages,
        hasMore: pagination.page < pagination.totalPages,
        query,
      };

      set({
        clinics,
        page: pagination.page,
        totalPages: pagination.totalPages,
        hasMore: pagination.page < pagination.totalPages,
        cache: {
          ...get().cache,
          [cacheKey]: cacheEntry,
        },
        error: null,
      });
    } catch (e: any) {
      set({ error: e.message || i18next.t('errors.loadingFailed') });
    } finally {
      if (refresh) {
        set({ isRefreshing: false });
      } else {
        set({ isLoading: false });
      }
    }
  },

  /**
   * Fetch more clinics (infinite scroll)
   */
  fetchMoreClinics: async (query) => {
    const { page, totalPages, isLoadingMore, hasMore } = get();
    if (isLoadingMore || !hasMore || page >= totalPages) return;

    const nextPage = page + 1;
    set({ isLoadingMore: true, error: null });

    try {
      const response = await mapService.getClinics({
        ...query,
        page: nextPage,
        limit: query?.limit || DEFAULT_PAGE_SIZE,
      });

      const clinics = response.data ?? [];
      const pagination = response.pagination ?? {
        page: nextPage,
        totalPages: 1,
      };

      set((state) => ({
        clinics: [...state.clinics, ...clinics],
        page: pagination.page,
        totalPages: pagination.totalPages,
        hasMore: pagination.page < pagination.totalPages,
        error: null,
      }));
    } catch (e: any) {
      set({ error: e.message || i18next.t('errors.loadingFailed') });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  /**
   * Search clinics with filters and coordinates
   */
  searchClinics: async (data: ClinicSearchRequest, reset: boolean = true) => {
    // ✅ page n'existe pas dans ClinicSearchRequest
    // On gère la pagination via un paramètre séparé
    const currentPage = reset ? 1 : get().searchPage + 1;

    if (reset) {
      set({
        isSearching: true,
        error: null,
        searchQuery: data.query,
        searchFilters: data.filters,
        searchCoordinates: data.coordinates,
        searchResults: [],
        searchPage: 1,
        searchTotalPages: 1,
        searchHasMore: false,
      });
    } else {
      set({ isSearchingMore: true, error: null });
    }

    try {
      // ✅ Appel au service avec les données de recherche
      const results = await mapService.searchClinics(data);

      // ✅ Vérifier que results est bien un tableau
      const resultsArray = Array.isArray(results) ? results : [];

      // ✅ Mettre à jour les résultats
      set({
        searchResults: reset
          ? resultsArray
          : [...get().searchResults, ...resultsArray],
        // ✅ La pagination est gérée par le service ou on utilise des valeurs par défaut
        searchPage: currentPage,
        searchTotalPages:
          Math.ceil(resultsArray.length / DEFAULT_PAGE_SIZE) || 1,
        searchHasMore: resultsArray.length === DEFAULT_PAGE_SIZE,
        error: null,
      });
    } catch (e: any) {
      set({ error: e.message || i18next.t('errors.searchFailed') });
    } finally {
      if (reset) {
        set({ isSearching: false });
      } else {
        set({ isSearchingMore: false });
      }
    }
  },

  /**
   * Search more clinics (infinite scroll for search)
   */
  searchMoreClinics: async (data: ClinicSearchRequest) => {
    const {
      searchPage,
      searchTotalPages,
      searchHasMore,
      isSearching,
      isSearchingMore,
    } = get();

    if (
      isSearching ||
      isSearchingMore ||
      !searchHasMore ||
      searchPage >= searchTotalPages
    ) {
      return;
    }

    await get().searchClinics(data, false);
  },

  /**
   * Clear search results
   */
  clearSearch: () => {
    set({
      searchResults: [],
      searchQuery: "",
      searchFilters: undefined,
      searchCoordinates: undefined,
      searchPage: 1,
      searchTotalPages: 1,
      searchHasMore: false,
      isSearching: false,
      isSearchingMore: false,
    });
  },

  /**
   * Fetch clinic by ID
   */
  fetchClinicById: async (id: string) => {
    set({ isLoadingDetail: true, error: null });

    try {
      const clinic = await mapService.getClinicDetails(id);
      set({ selectedClinic: clinic, error: null });
    } catch (e: any) {
      set({ error: e.message || i18next.t('errors.profileLoadFailed') });
    } finally {
      set({ isLoadingDetail: false });
    }
  },

  /**
   * Set selected clinic
   */
  setSelectedClinic: (clinic) => set({ selectedClinic: clinic }),

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Clear cache
   */
  clearCache: () => set({ cache: {} }),

  /**
   * Reset store
   */
  reset: () => {
    set({
      clinics: [],
      searchResults: [],
      selectedClinic: null,
      isLoading: false,
      isRefreshing: false,
      isLoadingMore: false,
      isLoadingDetail: false,
      isSearching: false,
      isSearchingMore: false,
      page: 1,
      totalPages: 1,
      hasMore: false,
      searchPage: 1,
      searchTotalPages: 1,
      searchHasMore: false,
      searchQuery: "",
      searchFilters: undefined,
      searchCoordinates: undefined,
      error: null,
    });
  },
}));
