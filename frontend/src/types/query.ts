export type QueryStatus = 'pending' | 'completed';

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
}

export interface NewQuery {
  businessType: string;
  city: string;
}

export interface QueryVersion {
  id: string;
  queryId: string;
  versionNumber: number;
  createdAt: string;
  businessCount: number;
  savedToFirebase: boolean;
  savedAt: string | null;
}

export interface QueryFilters {
  businessType: string | null;
  city: string | null;
  status: QueryStatus | null;
}
