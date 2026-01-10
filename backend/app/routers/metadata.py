from fastapi import APIRouter, Depends
from ..middleware.auth import get_current_user
from ..models.auth import TokenData
from ..services.firebase_service import FirebaseService

router = APIRouter(prefix="/metadata", tags=["metadata"])


def get_firebase_service():
    return FirebaseService()


@router.get("/business-types")
async def get_business_types(
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Get distinct business types from user's queries."""
    types = firebase.get_distinct_business_types(current_user.uid)
    return {"businessTypes": types}


@router.get("/cities")
async def get_cities(
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Get distinct cities from user's queries."""
    cities = firebase.get_distinct_cities(current_user.uid)
    return {"cities": cities}
