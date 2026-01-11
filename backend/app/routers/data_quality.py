"""
Data Quality Router - Endpoints for data quality reports and analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, List, Any

from ..middleware.auth import get_current_user
from ..models.auth import TokenData
from ..services.firebase_service import FirebaseService
from ..services.data_quality import generate_quality_report

router = APIRouter(prefix="/queries", tags=["data_quality"])


def get_firebase_service():
    return FirebaseService()


class ScoreDistribution(BaseModel):
    excellent: int  # 90-100
    good: int       # 70-89
    fair: int       # 50-69
    poor: int       # 0-49


class QualityReportResponse(BaseModel):
    totalRecords: int
    complete: int
    incomplete: int
    duplicates: int
    duplicateRecords: int
    averageScore: float
    missingFields: Dict[str, int]
    scoreDistribution: ScoreDistribution


@router.get(
    "/{query_id}/versions/{version_id}/quality-report",
    response_model=QualityReportResponse,
)
async def get_quality_report(
    query_id: str,
    version_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """
    Get data quality report for a specific version.

    Returns statistics about data completeness, duplicates, and missing fields.

    - **totalRecords**: Total number of businesses in the version
    - **complete**: Number of businesses with score >= 80
    - **incomplete**: Number of businesses with score < 80
    - **duplicates**: Number of duplicate groups found
    - **duplicateRecords**: Total records involved in duplicates
    - **averageScore**: Average completeness score (0-100)
    - **missingFields**: Count of missing values per field
    - **scoreDistribution**: Breakdown by score range (excellent/good/fair/poor)
    """
    # Verify query exists and belongs to user
    query = firebase.get_query(query_id)
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query not found",
        )
    if query.get("createdBy") != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # Get businesses for the version
    businesses = firebase.get_version_businesses(query_id, version_id)
    if not businesses:
        # Return empty report if no businesses
        return QualityReportResponse(
            totalRecords=0,
            complete=0,
            incomplete=0,
            duplicates=0,
            duplicateRecords=0,
            averageScore=0,
            missingFields={},
            scoreDistribution=ScoreDistribution(
                excellent=0,
                good=0,
                fair=0,
                poor=0,
            ),
        )

    # Generate quality report
    report = generate_quality_report(businesses)

    return QualityReportResponse(
        totalRecords=report["totalRecords"],
        complete=report["complete"],
        incomplete=report["incomplete"],
        duplicates=report["duplicates"],
        duplicateRecords=report["duplicateRecords"],
        averageScore=report["averageScore"],
        missingFields=report["missingFields"],
        scoreDistribution=ScoreDistribution(**report["scoreDistribution"]),
    )
