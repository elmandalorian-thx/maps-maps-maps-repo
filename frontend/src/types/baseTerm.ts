export interface BaseTermStats {
  totalQueries: number;
  pendingQueries: number;
  completeQueries: number;
  errorQueries: number;
}

export interface BaseTerm {
  id: string;
  term: string;
  category?: string;
  createdAt: string;
  userId: string;
  stats: BaseTermStats;
}

export interface NewBaseTerm {
  term: string;
  category?: string;
}

export interface BulkGenerateRequest {
  countries: string[];  // ['CA', 'US'] or ['ALL']
  provinces: string[];  // ['ON', 'TX'] or ['ALL']
  cities: string[];     // ['Oakville', 'Austin'] or ['ALL']
}

export interface BulkGenerateResponse {
  created: number;
  skipped: number;
  total: number;
  message: string;
}

export interface QueueStatus {
  pending: number;
  queued: number;
  running: number;
  complete: number;
  error: number;
  paused: boolean;
  estimatedTimeRemaining?: number;
  currentlyProcessing?: string;
}

export interface AddToQueueResponse {
  added: number;
  message: string;
}

export interface QueueControlResponse {
  success: boolean;
  message: string;
}
