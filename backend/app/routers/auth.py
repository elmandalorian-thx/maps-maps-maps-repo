from fastapi import APIRouter, Depends
from ..middleware.auth import get_current_user, verify_firebase_token
from ..models.auth import TokenData, VerifyTokenRequest, VerifyTokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/verify", response_model=VerifyTokenResponse)
async def verify_token(request: VerifyTokenRequest):
    """Verify Firebase ID token."""
    try:
        user = verify_firebase_token(request.id_token)
        return VerifyTokenResponse(valid=True, user=user)
    except Exception:
        return VerifyTokenResponse(valid=False, user=None)


@router.get("/me", response_model=TokenData)
async def get_me(current_user: TokenData = Depends(get_current_user)):
    """Get current authenticated user."""
    return current_user
