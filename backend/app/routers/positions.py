"""
Position Ranking Router

Endpoints for managing business position rankings within query versions
and the main businesses collection.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from ..middleware.auth import get_current_user
from ..models.auth import TokenData
from ..services.firebase_service import FirebaseService

router = APIRouter(prefix="/positions", tags=["positions"])


def get_firebase_service():
    return FirebaseService()


class UpdatePositionRequest(BaseModel):
    """Request body for updating a business position."""
    customPosition: int


class PositionUpdateResponse(BaseModel):
    """Response after updating position."""
    success: bool
    business_id: str
    custom_position: int
    message: str


# ==================== VERSION BUSINESS POSITIONS ====================


@router.patch(
    "/queries/{query_id}/versions/{version_id}/businesses/{business_id}",
    response_model=PositionUpdateResponse,
)
async def update_version_business_position(
    query_id: str,
    version_id: str,
    business_id: str,
    request: UpdatePositionRequest,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """
    Update the custom position for a business in a specific version.

    This allows users to reorder businesses within their search results
    to prioritize certain businesses over others.

    - **query_id**: The query ID
    - **version_id**: The version ID containing the business
    - **business_id**: The business place_id
    - **customPosition**: New position (1-based index)
    """
    # Verify user owns the query
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

    # Validate position
    if request.customPosition < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Position must be a positive integer (1 or greater)",
        )

    try:
        updated_business = firebase.update_business_position(
            query_id=query_id,
            version_id=version_id,
            business_id=business_id,
            custom_position=request.customPosition,
        )
        return PositionUpdateResponse(
            success=True,
            business_id=business_id,
            custom_position=request.customPosition,
            message="Position updated successfully",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update position: {str(e)}",
        )


@router.get("/queries/{query_id}/versions/{version_id}/businesses")
async def get_version_businesses_sorted(
    query_id: str,
    version_id: str,
    sort_by: str = "google_position",
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """
    Get all businesses for a version, sorted by position.

    - **query_id**: The query ID
    - **version_id**: The version ID
    - **sort_by**: Sort field - "google_position" or "custom_position"
    """
    # Verify user owns the query
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

    # Validate sort_by parameter
    if sort_by not in ["google_position", "custom_position"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="sort_by must be 'google_position' or 'custom_position'",
        )

    businesses = firebase.get_version_businesses_sorted(
        query_id=query_id,
        version_id=version_id,
        sort_by=sort_by,
    )
    return {"businesses": businesses, "count": len(businesses), "sortedBy": sort_by}


# ==================== MAIN COLLECTION BUSINESS POSITIONS ====================


@router.patch("/businesses/{business_id}", response_model=PositionUpdateResponse)
async def update_main_business_position(
    business_id: str,
    request: UpdatePositionRequest,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """
    Update the custom position for a business in the main businesses collection.

    This is used when businesses have been saved to the main collection
    and need to be reordered for directory display.

    - **business_id**: The business place_id
    - **customPosition**: New position (1-based index)
    """
    # Validate position
    if request.customPosition < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Position must be a positive integer (1 or greater)",
        )

    try:
        # Get the business to verify it exists
        business = firebase.get_business(business_id)
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found",
            )

        # Update position
        updated_business = firebase.update_main_business_position(
            business_id=business_id,
            custom_position=request.customPosition,
        )
        return PositionUpdateResponse(
            success=True,
            business_id=business_id,
            custom_position=request.customPosition,
            message="Position updated successfully",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update position: {str(e)}",
        )


@router.get("/businesses/{business_id}")
async def get_business(
    business_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """
    Get a single business from the main collection.

    - **business_id**: The business place_id
    """
    business = firebase.get_business(business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )
    return business
