from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class BaseTermStats(BaseModel):
    totalQueries: int = 0
    pendingQueries: int = 0
    completeQueries: int = 0
    errorQueries: int = 0


class BaseTerm(BaseModel):
    id: str
    term: str
    category: Optional[str] = None
    createdAt: str
    userId: str
    stats: BaseTermStats = BaseTermStats()


class NewBaseTerm(BaseModel):
    term: str
    category: Optional[str] = None


class BaseTermResponse(BaseModel):
    baseTerm: BaseTerm


class BaseTermsResponse(BaseModel):
    baseTerms: List[BaseTerm]
    total: int


class BulkGenerateRequest(BaseModel):
    countries: List[str]  # ['CA', 'US'] or ['ALL']
    provinces: List[str]  # ['ON', 'TX'] or ['ALL']
    cities: List[str]     # ['Oakville', 'Austin'] or ['ALL']


class BulkGenerateResponse(BaseModel):
    created: int
    skipped: int
    total: int
    message: str
