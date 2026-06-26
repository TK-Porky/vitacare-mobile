import { QueryClient } from '@tanstack/react-query';

/**
 * This file exports a query client instance for use with react-query.
 * 
 * @module query.client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
