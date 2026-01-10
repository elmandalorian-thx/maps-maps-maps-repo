from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from ..models.auth import TokenData

security = HTTPBearer()


def verify_firebase_token(token: str) -> TokenData:
    """Verify Firebase ID token and return user data."""
    try:
        decoded_token = auth.verify_id_token(token)
        return TokenData(
            uid=decoded_token["uid"],
            email=decoded_token.get("email"),
            name=decoded_token.get("name"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """Dependency to get current authenticated user."""
    return verify_firebase_token(credentials.credentials)
