from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from ..middleware.auth import get_current_user
from ..models.auth import TokenData
from ..models.query import (
    Query,
    NewQuery,
    QueriesResponse,
    QueryVersion,
    VersionsResponse,
)
from ..models.business import Business
from ..services.firebase_service import FirebaseService

router = APIRouter(prefix="/queries", tags=["queries"])


def get_firebase_service():
    return FirebaseService()


@router.get("", response_model=QueriesResponse)
async def list_queries(
    businessType: Optional[str] = None,
    city: Optional[str] = None,
    query_status: Optional[str] = None,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """List all queries for the current user."""
    queries = firebase.get_queries(
        user_id=current_user.uid,
        business_type=businessType,
        city=city,
        status=query_status,
    )
    return QueriesResponse(
        queries=[Query(**q) for q in queries],
        total=len(queries),
    )


@router.get("/{query_id}", response_model=Query)
async def get_query(
    query_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Get a single query by ID."""
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
    return Query(**query)


@router.post("", response_model=Query)
async def create_query(
    new_query: NewQuery,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Create a new query."""
    try:
        query = firebase.create_query(
            user_id=current_user.uid,
            business_type=new_query.businessType,
            city=new_query.city,
        )
        return Query(**query)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{query_id}")
async def delete_query(
    query_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Delete a query."""
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
    firebase.delete_query(query_id)
    return {"success": True}


# ==================== VERSIONS ====================


@router.get("/{query_id}/versions", response_model=VersionsResponse)
async def list_versions(
    query_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """List all versions for a query."""
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
    versions = firebase.get_versions(query_id)
    return VersionsResponse(versions=[QueryVersion(**v) for v in versions])


@router.post("/{query_id}/versions", response_model=QueryVersion)
async def create_version(
    query_id: str,
    businesses: List[dict] = Body(..., embed=True),
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Create a new version with business data."""
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
    version = firebase.create_version(query_id, businesses)
    return QueryVersion(**version)


@router.get("/{query_id}/versions/{version_id}")
async def get_version_data(
    query_id: str,
    version_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Get businesses for a specific version."""
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
    businesses = firebase.get_version_businesses(query_id, version_id)
    return {"businesses": businesses}


@router.post("/{query_id}/versions/{version_id}/save")
async def save_version_to_firebase(
    query_id: str,
    version_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Save version businesses to main Firebase collection."""
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
    result = firebase.save_version_to_main(query_id, version_id)
    return result


@router.patch("/{query_id}/versions/{version_id}/latest")
async def set_version_as_latest(
    query_id: str,
    version_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Set a version as the latest version for a query.

    This clears the isLatest flag from all other versions and sets it
    on the specified version. Only one version per query can be 'latest'.
    """
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
    try:
        result = firebase.set_version_as_latest(query_id, version_id)
        return QueryVersion(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post("/{query_id}/versions/{version_id}/publish")
async def publish_to_directory(
    query_id: str,
    version_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Publish businesses from a version to the main directory.

    This copies all businesses from the specified version to the main
    'businesses' collection with is_latest_version=True. It also marks
    any previously published businesses from this query as not latest.

    The version is automatically set as the 'latest' version for the query.
    """
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
    try:
        result = firebase.publish_to_directory(query_id, version_id)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
