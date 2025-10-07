"""
Authentication API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

# Import our authentication utilities and models
from api.auth.utils import AuthUtils, get_current_user, get_current_user_optional
from api.database.mongodb_models import (
    UserCreate, UserResponse, UserInDB, LoginRequest, 
    TokenResponse, PasswordResetRequest, PasswordResetConfirm,
    ChangePasswordRequest, UserRole, UserStatus
)
from api.database.mongodb import get_database, UserService, AuditService

router = APIRouter()

# Helper functions
async def get_client_ip(request: Request) -> str:
    """Get client IP address"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserCreate,
    request: Request,
    db = Depends(get_database)
):
    """Register a new user"""
    user_service = UserService(db)
    audit_service = AuditService(db)
    
    try:
        # Check if user already exists
        existing_user = await user_service.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate password strength
        password_validation = AuthUtils.validate_password_strength(user_data.password)
        if not password_validation["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Password validation failed: {', '.join(password_validation['errors'])}"
            )
        
        # Create user document
        user_doc = UserInDB(
            **user_data.model_dump(exclude={"password"}),
            hashed_password=AuthUtils.get_password_hash(user_data.password),
            email_verification_token=AuthUtils.generate_secure_token()
        ).model_dump(by_alias=True)
        
        # Convert quiz_answers keys to strings for MongoDB compatibility (after model_dump)
        if user_doc.get("quiz_answers"):
            user_doc["quiz_answers"] = {
                str(k): v for k, v in user_doc["quiz_answers"].items()
            }
        
        # Save user to database
        user_id = await user_service.create_user(user_doc)
        
        # Create tokens
        token_data = {"sub": user_id, "email": user_data.email, "role": user_data.role.value}
        access_token = AuthUtils.create_access_token(token_data)
        refresh_token = AuthUtils.create_refresh_token(token_data)
        
        # Log the registration
        await audit_service.log_action({
            "user_id": ObjectId(user_id),
            "action": "user_registration",
            "ip_address": await get_client_ip(request),
            "user_agent": request.headers.get("User-Agent"),
            "success": True
        })
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=30 * 60  # 30 minutes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Registration failed for {user_data.email}: {str(e)}")
        logger.error(f"Full traceback: {error_details}")
        
        # Try to log failed registration (might fail too)
        try:
            await audit_service.log_action({
                "action": "user_registration",
                "ip_address": await get_client_ip(request),
                "user_agent": request.headers.get("User-Agent"),
                "success": False,
                "error_message": str(e)
            })
        except:
            logger.error("Failed to log audit entry")
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db = Depends(get_database)
):
    """Login user and return JWT tokens"""
    user_service = UserService(db)
    audit_service = AuditService(db)
    
    try:
        # Find user by email
        user_doc = await user_service.get_user_by_email(login_data.email)
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if account is locked
        if user_doc.get("account_locked_until") and datetime.now(timezone.utc) < user_doc["account_locked_until"]:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account is temporarily locked due to multiple failed login attempts"
            )
        
        # Verify password
        if not AuthUtils.verify_password(login_data.password, user_doc["hashed_password"]):
            # Increment failed login attempts
            failed_attempts = user_doc.get("failed_login_attempts", 0) + 1
            update_data = {"failed_login_attempts": failed_attempts}
            
            # Lock account after 5 failed attempts
            if failed_attempts >= 5:
                update_data["account_locked_until"] = datetime.now(timezone.utc) + timedelta(minutes=30)
            
            await user_service.update_user(str(user_doc["_id"]), update_data)
            
            # Log failed login
            await audit_service.log_action({
                "user_id": user_doc["_id"],
                "action": "login_failed",
                "ip_address": await get_client_ip(request),
                "user_agent": request.headers.get("User-Agent"),
                "success": False,
                "error_message": "Invalid password"
            })
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Reset failed login attempts on successful login
        await user_service.update_user(str(user_doc["_id"]), {
            "failed_login_attempts": 0,
            "account_locked_until": None,
            "last_login": datetime.now(timezone.utc)
        })
        
        # Create tokens
        token_data = {
            "sub": str(user_doc["_id"]),
            "email": user_doc["email"], 
            "role": user_doc.get("role", "basic")
        }
        access_token = AuthUtils.create_access_token(token_data)
        refresh_token = AuthUtils.create_refresh_token(token_data)
        
        # Log successful login
        await audit_service.log_action({
            "user_id": user_doc["_id"],
            "action": "login_success",
            "ip_address": await get_client_ip(request),
            "user_agent": request.headers.get("User-Agent"),
            "success": True
        })
        
        # Track daily login for XP
        try:
            from api.services.xp_service import XPService
            xp_service = XPService(db)
            await xp_service.track_login(user_id=str(user_doc["_id"]))
        except Exception as xp_error:
            # Don't fail the login if XP tracking fails
            logger.warning(f"Login XP tracking failed: {xp_error}")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=30 * 60  # 30 minutes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Log system error
        await audit_service.log_action({
            "action": "login_error",
            "ip_address": await get_client_ip(request),
            "user_agent": request.headers.get("User-Agent"),
            "success": False,
            "error_message": str(e)
        })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get current user profile"""
    user_service = UserService(db)
    
    try:
        # Get full user data from database
        user_doc = await user_service.get_user_by_id(current_user["user_id"])
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=str(user_doc["_id"]),
            email=user_doc["email"],
            full_name=user_doc["full_name"],
            role=user_doc.get("role", "basic"),
            is_verified=user_doc.get("is_verified", False),
            status=user_doc.get("status", "active"),
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"],
            last_login=user_doc.get("last_login")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching profile"
        )

@router.get("/verify-token")
async def verify_token(current_user: dict = Depends(get_current_user_optional)):
    """Verify if token is valid"""
    if current_user:
        return {
            "valid": True,
            "user_id": current_user["user_id"],
            "email": current_user["email"],
            "role": current_user["role"]
        }
    else:
        return {"valid": False}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_data: dict = {"refresh_token": ""}):
    """Refresh access token using refresh token"""
    try:
        refresh_token = refresh_data.get("refresh_token")
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token required"
            )
        
        # Verify refresh token
        payload = AuthUtils.verify_token(refresh_token, "refresh")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Create new access token
        token_data = {
            "sub": payload["sub"],
            "email": payload["email"],
            "role": payload.get("role", "basic")
        }
        new_access_token = AuthUtils.create_access_token(token_data)
        new_refresh_token = AuthUtils.create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=30 * 60
        )
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )
