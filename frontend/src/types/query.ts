export type QueryStatus = 'pending' | 'queued' | 'running' | 'complete' | 'error' | 'paused' | 'completed';

export interface Query {
  id: string;
  businessType: string;
  city: string;
  fullQuery: string;
  status: QueryStatus;
  lastRunDate: string | null;
  versionsCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // New fields for Quarry integration
  province?: string;
  country?: string;
  baseTermId?: string;
  latestVersionId?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  resultCount?: number;
}

export interface NewQuery {
  businessType: string;
  city: string;
  province?: string;
  country?: string;
  baseTermId?: string;
}

export interface QueryVersion {
  id: string;
  queryId: string;
  versionNumber: number;
  createdAt: string;
  businessCount: number;
  savedToFirebase: boolean;
  savedAt: string | null;
  isLatest?: boolean;
}

export interface QueryFilters {
  businessType: string | null;
  city: string | null;
  status: QueryStatus | null;
  province: string | null;
  country: string | null;
  baseTermId: string | null;
  search: string | null;
}

// Data Quality Types
export interface FieldQuality {
  field: string;
  presentCount: number;
  missingCount: number;
  completionRate: number;
}

export interface DuplicateRecord {
  placeId: string;
  businessName: string;
  count: number;
}

export interface BusinessQuality {
  placeId: string;
  businessName: string;
  score: number;
  missingFields: string[];
  isComplete: boolean;
}

export interface QualityReport {
  totalRecords: number;
  completeRecords: number;
  incompleteRecords: number;
  overallScore: number;
  fieldStats: FieldQuality[];
  duplicates: DuplicateRecord[];
  duplicateCount: number;
  businessQuality: BusinessQuality[];
}
