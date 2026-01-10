from typing import Optional
from pydantic import BaseModel


class TokenData(BaseModel):
    uid: str
    email: Optional[str] = None
    name: Optional[str] = None


class VerifyTokenRequest(BaseModel):
    id_token: str


class VerifyTokenResponse(BaseModel):
    valid: bool
    user: Optional[TokenData] = None
