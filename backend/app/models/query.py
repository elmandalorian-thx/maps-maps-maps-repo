from typing import Optional, List, Literal
from pydantic import BaseModel
from datetime import datetime


class NewQuery(BaseModel):
    businessType: str
    city: str


class QueryVersion(BaseModel):
    id: str
    queryId: str
    versionNumber: int
    createdAt: str
    businessCount: int
    savedToFirebase: bool
    savedAt: Optional[str] = None


class Query(BaseModel):
    id: str
    businessType: str
    city: str
    fullQuery: str
    status: Literal["pending", "completed"]
    lastRunDate: Optional[str] = None
    versionsCount: int = 0
    createdAt: str
    updatedAt: str
    createdBy: str


class QueryResponse(BaseModel):
    query: Query
    versions: List[QueryVersion] = []


class QueriesResponse(BaseModel):
    queries: List[Query]
    total: int


class VersionsResponse(BaseModel):
    versions: List[QueryVersion]
