"""
Authentication API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from api.auth.utils import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    get_user_from_token
)
from api.database.models import User, UserTypeEnum

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    user_type: UserTypeEnum = UserTypeEnum.BEGINNER

class UserResponse(BaseModel):
    user_id: int
    email: str
    user_type: str
    created_date: datetime
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister):
    """Register a new user"""
    # TODO: Add database check for existing email
    # TODO: Add actual database insertion
    
    # Placeholder implementation
    hashed_password = get_password_hash(user_data.password)
    
    # Create dummy user response (replace with actual DB operation)
    user = UserResponse(
        user_id=1,  # This would come from database
        email=user_data.email,
        user_type=user_data.user_type.value,
        created_date=datetime.utcnow(),
        is_active=True
    )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(user.user_id),
            "email": user.email,
            "user_type": user.user_type
        }
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user and return JWT token"""
    # TODO: Add database user lookup
    # TODO: Add password verification
    
    # Placeholder implementation
    email = form_data.username  # OAuth2 uses username field for email
    password = form_data.password
    
    # Mock user verification (replace with actual DB lookup)
    if email == "demo@example.com" and password == "demo123":
        user = UserResponse(
            user_id=1,
            email=email,
            user_type="beginner",
            created_date=datetime.utcnow(),
            is_active=True
        )
        
        access_token = create_access_token(
            data={
                "sub": str(user.user_id),
                "email": user.email,
                "user_type": user.user_type
            }
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.get("/profile", response_model=UserResponse)
async def get_profile(token: str = Depends(oauth2_scheme)):
    """Get current user profile"""
    user_data = get_user_from_token(token)
    
    # TODO: Fetch full user data from database
    user = UserResponse(
        user_id=user_data["user_id"],
        email=user_data["email"],
        user_type=user_data["user_type"],
        created_date=datetime.utcnow(),
        is_active=True
    )
    
    return user

@router.get("/verify-token")
async def verify_user_token(token: str = Depends(oauth2_scheme)):
    """Verify if token is valid"""
    user_data = get_user_from_token(token)
    return {
        "valid": True,
        "user_id": user_data["user_id"],
        "user_type": user_data["user_type"]
    }

# Dependency for protected routes
def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency to get current authenticated user"""
    return get_user_from_token(token)

def require_user_type(*allowed_types: UserTypeEnum):
    """Decorator to require specific user types"""
    def decorator(current_user: dict = Depends(get_current_user)):
        user_type = current_user.get("user_type")
        if user_type not in [t.value for t in allowed_types]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required user type: {[t.value for t in allowed_types]}"
            )
        return current_user
    return decorator
