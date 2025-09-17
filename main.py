"""
Stock Market Prediction App - FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager

from config.settings import settings
from api.routes import predictions, stocks, health, auth, portfolio, goals, recommendations, websocket
from api.database import mongodb, postgresql

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("🚀 Starting Stock Market Prediction API...")
    
    # Initialize database connections
    await mongodb.connect()
    await postgresql.connect()
    
    yield
    
    # Shutdown
    print("🔴 Shutting down Stock Market Prediction API...")
    await mongodb.disconnect()
    await postgresql.disconnect()

# Create FastAPI app
app = FastAPI(
    title="Stock Market Prediction API",
    description="AI-powered stock market prediction and analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(stocks.router, prefix="/api/v1", tags=["Stocks"])
app.include_router(predictions.router, prefix="/api/v1", tags=["Predictions"])
app.include_router(portfolio.router, prefix="/api/v1", tags=["Portfolio"])
app.include_router(goals.router, prefix="/api/v1", tags=["Goals"])
app.include_router(recommendations.router, prefix="/api/v1", tags=["Recommendations"])
app.include_router(websocket.router, prefix="/api/v1", tags=["WebSocket"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Stock Market Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """General exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal server error",
            "status_code": 500
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug_mode,
        log_level=settings.log_level.lower()
    )
