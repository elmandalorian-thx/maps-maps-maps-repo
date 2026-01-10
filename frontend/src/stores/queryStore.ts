import { create } from 'zustand';
import type { Query, QueryFilters, QueryVersion, Business } from '@/types';

interface QueryState {
  // Filters
  filters: QueryFilters;

  // Selected query and version
  selectedQuery: Query | null;
  selectedVersion: QueryVersion | null;

  // Preview data
  previewData: Business[];
  previewLoading: boolean;

  // Actions
  setFilters: (filters: Partial<QueryFilters>) => void;
  resetFilters: () => void;
  setSelectedQuery: (query: Query | null) => void;
  setSelectedVersion: (version: QueryVersion | null) => void;
  setPreviewData: (data: Business[]) => void;
  setPreviewLoading: (loading: boolean) => void;
  clearPreview: () => void;
}

const initialFilters: QueryFilters = {
  businessType: null,
  city: null,
  status: null,
};

export const useQueryStore = create<QueryState>((set) => ({
  filters: initialFilters,
  selectedQuery: null,
  selectedVersion: null,
  previewData: [],
  previewLoading: false,

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: initialFilters }),

  setSelectedQuery: (query) => set({ selectedQuery: query }),

  setSelectedVersion: (version) => set({ selectedVersion: version }),

  setPreviewData: (data) => set({ previewData: data }),

  setPreviewLoading: (loading) => set({ previewLoading: loading }),

  clearPreview: () => set({ previewData: [], selectedVersion: null }),
}));
