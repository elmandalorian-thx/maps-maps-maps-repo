from typing import Optional, List, Literal
from pydantic import BaseModel
from datetime import datetime


# Query status types - expanded for queue system
QueryStatus = Literal["pending", "queued", "running", "complete", "error", "paused", "completed"]


class NewQuery(BaseModel):
    businessType: str
    city: str
    # New optional fields for Quarry integration
    province: Optional[str] = None
    country: Optional[str] = None
    baseTermId: Optional[str] = None


class QueryVersion(BaseModel):
    id: str
    queryId: str
    versionNumber: int
    createdAt: str
    businessCount: int
    savedToFirebase: bool
    savedAt: Optional[str] = None
    isLatest: bool = False  # Field for marking the latest version
    publishedToDirectory: bool = False  # Whether this version has been published
    publishedAt: Optional[str] = None  # When this version was published to directory
    updatedAt: Optional[str] = None  # When this version was last updated


class Query(BaseModel):
    id: str
    businessType: str  # This is now the base term (e.g., "naturopathic doctor")
    city: str
    fullQuery: str
    status: QueryStatus = "pending"
    lastRunDate: Optional[str] = None
    versionsCount: int = 0
    createdAt: str
    updatedAt: str
    createdBy: str
    # New fields for Quarry integration
    province: Optional[str] = None
    country: Optional[str] = None
    baseTermId: Optional[str] = None  # Reference to base_terms collection
    latestVersionId: Optional[str] = None  # Reference to the latest version
    startedAt: Optional[str] = None  # When extraction started
    completedAt: Optional[str] = None  # When extraction completed
    error: Optional[str] = None  # Error message if failed
    resultCount: Optional[int] = None  # Number of results from last extraction


class QueryResponse(BaseModel):
    query: Query
    versions: List[QueryVersion] = []


class QueriesResponse(BaseModel):
    queries: List[Query]
    total: int


class VersionsResponse(BaseModel):
    versions: List[QueryVersion]


# New models for bulk operations
class BulkRunRequest(BaseModel):
    queryIds: List[str]


class BulkRunResponse(BaseModel):
    queued: int
    failed: int
    message: str


class QueueStatus(BaseModel):
    pending: int
    queued: int
    running: int
    complete: int
    error: int
    estimatedTimeRemaining: Optional[int] = None  # seconds
    currentlyProcessing: Optional[str] = None  # query ID
