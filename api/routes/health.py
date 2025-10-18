from fastapi import APIRouter
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    version: str

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        service="Stolckr API",
        version="2.0.0"
    )