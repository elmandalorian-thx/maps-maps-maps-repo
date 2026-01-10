from fastapi import APIRouter, Depends, HTTPException, status
from ..middleware.auth import get_current_user
from ..models.auth import TokenData
from ..models.business import ExtractionResponse
from ..services.firebase_service import FirebaseService
from ..services.extractor_service import ExtractorService

router = APIRouter(prefix="/queries", tags=["extraction"])


def get_firebase_service():
    return FirebaseService()


def get_extractor_service():
    return ExtractorService()


@router.post("/{query_id}/extract", response_model=ExtractionResponse)
async def run_extraction(
    query_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
    extractor: ExtractorService = Depends(get_extractor_service),
):
    """
    Run Google Maps extraction for a query.
    Returns extracted businesses.
    """
    # Get the query
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

    # Run extraction
    try:
        result = extractor.extract_businesses(query.get("fullQuery", ""))
        return ExtractionResponse(
            businesses=result["businesses"],
            count=result["count"],
            executionTime=result["executionTime"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction failed: {str(e)}",
        )
