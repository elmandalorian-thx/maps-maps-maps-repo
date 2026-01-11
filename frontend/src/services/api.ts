import axios from 'axios';
import { getIdToken } from './auth';
import type {
  Query,
  NewQuery,
  QueryVersion,
  Business,
  QueryFilters,
  BaseTerm,
  NewBaseTerm,
  BulkGenerateRequest,
  BulkGenerateResponse,
  QueueStatus,
  AddToQueueResponse,
  QueueControlResponse,
  QualityReport,
} from '@/types';

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

export const setVersionAsLatest = async (
  queryId: string,
  versionId: string
): Promise<{ message: string }> => {
  const response = await api.post(`/queries/${queryId}/versions/${versionId}/set-latest`);
  return response.data;
};

export const publishToDirectory = async (
  queryId: string,
  versionId: string
): Promise<{ published: number; updated: number; errors: number }> => {
  const response = await api.post(`/queries/${queryId}/versions/${versionId}/publish`);
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

// ==================== BASE TERMS ENDPOINTS ====================

export const fetchBaseTerms = async (): Promise<BaseTerm[]> => {
  const response = await api.get('/base-terms');
  return response.data.baseTerms;
};

export const fetchBaseTerm = async (id: string): Promise<BaseTerm> => {
  const response = await api.get(`/base-terms/${id}`);
  return response.data;
};

export const createBaseTerm = async (term: NewBaseTerm): Promise<BaseTerm> => {
  const response = await api.post('/base-terms', term);
  return response.data;
};

export const deleteBaseTerm = async (id: string): Promise<void> => {
  await api.delete(`/base-terms/${id}`);
};

export const generateQueries = async (
  termId: string,
  request: BulkGenerateRequest
): Promise<BulkGenerateResponse> => {
  const response = await api.post(`/base-terms/${termId}/generate`, request);
  return response.data;
};

export const refreshBaseTermStats = async (termId: string): Promise<void> => {
  await api.post(`/base-terms/${termId}/refresh-stats`);
};

export const fetchQueueStatus = async (): Promise<QueueStatus> => {
  const response = await api.get('/queue/status');
  return response.data;
};

// ==================== QUEUE CONTROL ENDPOINTS ====================

export const addToQueue = async (queryIds: string[]): Promise<AddToQueueResponse> => {
  const response = await api.post('/queue/add', { query_ids: queryIds });
  return response.data;
};

export const pauseQueue = async (): Promise<QueueControlResponse> => {
  const response = await api.post('/queue/pause');
  return response.data;
};

export const resumeQueue = async (): Promise<QueueControlResponse> => {
  const response = await api.post('/queue/resume');
  return response.data;
};

export const retryFailedQueries = async (): Promise<AddToQueueResponse> => {
  const response = await api.post('/queue/retry-failed');
  return response.data;
};

// ==================== POSITION RANKING ENDPOINTS ====================

export const updateBusinessPosition = async (
  businessId: string,
  customPosition: number
): Promise<{ success: boolean }> => {
  const response = await api.patch(`/businesses/${businessId}/position`, {
    custom_position: customPosition,
  });
  return response.data;
};

export const updateBusinessPositions = async (
  updates: Array<{ business_id: string; custom_position: number }>
): Promise<{ success: boolean; updated: number }> => {
  const response = await api.patch('/businesses/positions', { updates });
  return response.data;
};

// ==================== DATA QUALITY ENDPOINTS ====================

export const getQualityReport = async (
  queryId: string,
  versionId: string
): Promise<QualityReport> => {
  const response = await api.get(`/queries/${queryId}/versions/${versionId}/quality`);
  return response.data;
};

export default api;
