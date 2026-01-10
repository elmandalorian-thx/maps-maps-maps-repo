import axios from 'axios';
import { getIdToken } from './auth';
import type { Query, NewQuery, QueryVersion, Business, QueryFilters } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Query endpoints
export const fetchQueries = async (filters?: QueryFilters): Promise<Query[]> => {
  const params = new URLSearchParams();
  if (filters?.businessType) params.append('businessType', filters.businessType);
  if (filters?.city) params.append('city', filters.city);
  if (filters?.status) params.append('status', filters.status);

  const response = await api.get(`/queries?${params.toString()}`);
  return response.data.queries;
};

export const fetchQuery = async (id: string): Promise<Query> => {
  const response = await api.get(`/queries/${id}`);
  return response.data;
};

export const createQuery = async (query: NewQuery): Promise<Query> => {
  const response = await api.post('/queries', query);
  return response.data;
};

export const deleteQuery = async (id: string): Promise<void> => {
  await api.delete(`/queries/${id}`);
};

// Extraction endpoints
export const runExtraction = async (queryId: string): Promise<{ businesses: Business[]; count: number }> => {
  const response = await api.post(`/queries/${queryId}/extract`);
  return response.data;
};

// Version endpoints
export const fetchVersions = async (queryId: string): Promise<QueryVersion[]> => {
  const response = await api.get(`/queries/${queryId}/versions`);
  return response.data.versions;
};

export const createVersion = async (
  queryId: string,
  businesses: Business[]
): Promise<QueryVersion> => {
  const response = await api.post(`/queries/${queryId}/versions`, { businesses });
  return response.data;
};

export const fetchVersionBusinesses = async (
  queryId: string,
  versionId: string
): Promise<Business[]> => {
  const response = await api.get(`/queries/${queryId}/versions/${versionId}`);
  return response.data.businesses;
};

export const saveVersionToFirebase = async (
  queryId: string,
  versionId: string
): Promise<{ saved: number; errors: number }> => {
  const response = await api.post(`/queries/${queryId}/versions/${versionId}/save`);
  return response.data;
};

// Export endpoints
export const downloadCSV = async (businesses: Business[]): Promise<Blob> => {
  const response = await api.post('/export/csv', { businesses }, {
    responseType: 'blob',
  });
  return response.data;
};

// Metadata endpoints
export const fetchBusinessTypes = async (): Promise<string[]> => {
  const response = await api.get('/metadata/business-types');
  return response.data.businessTypes;
};

export const fetchCities = async (): Promise<string[]> => {
  const response = await api.get('/metadata/cities');
  return response.data.cities;
};

export default api;
