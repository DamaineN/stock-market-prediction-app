from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import os

router = APIRouter()

# Environment variables for MongoDB (will be set in Vercel)
MONGODB_URL = os.getenv("MONGODB_URL", "")

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "beginner"

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str

# Simplified auth utilities
class AuthUtils:
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        import jwt
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=30)
        to_encode.update({"exp": expire})
        
        # Use a secret key from environment or default
        secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
        encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: dict):
        return AuthUtils.create_access_token(data, timedelta(days=7))

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    """Login endpoint with hardcoded admin user"""
    
    # Hardcoded admin user
    if login_data.email == "admin@stolckr.com" and login_data.password == "admin123":
        token_data = {
            "sub": "admin_hardcoded",
            "email": "admin@stolckr.com", 
            "role": "admin"
        }
        access_token = AuthUtils.create_access_token(token_data)
        refresh_token = AuthUtils.create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=30 * 60
        )
    
    # For demo purposes, allow test@stolckr.com / password123
    if login_data.email == "test@stolckr.com" and login_data.password == "password123":
        token_data = {
            "sub": "test_user",
            "email": "test@stolckr.com",
            "role": "beginner"
        }
        access_token = AuthUtils.create_access_token(token_data)
        refresh_token = AuthUtils.create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=30 * 60
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password"
    )

@router.post("/register", response_model=TokenResponse)
async def register(register_data: RegisterRequest):
    """Register new user"""
    
    # For demo purposes, reject already existing emails
    if register_data.email in ["admin@stolckr.com", "test@stolckr.com"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create token for new user
    token_data = {
        "sub": f"user_{register_data.email}",
        "email": register_data.email,
        "role": register_data.role
    }
    access_token = AuthUtils.create_access_token(token_data)
    refresh_token = AuthUtils.create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=30 * 60
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """Get current user info"""
    # This would normally decode the JWT token
    # For demo, return test user
    return UserResponse(
        id="test_user",
        email="test@stolckr.com",
        full_name="Test User",
        role="beginner",
        created_at=datetime.utcnow().isoformat()
    )