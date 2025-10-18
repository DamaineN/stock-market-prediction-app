from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime

# Import route handlers
from .routes.health import router as health_router
from .routes.auth import router as auth_router
from .routes.stocks import router as stocks_router

app = FastAPI(
    title="Stolckr API",
    description="Stock market prediction platform API",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix="/api/v1", tags=["Health"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(stocks_router, prefix="/api/v1", tags=["Stocks"])

@app.get("/")
async def root():
    return {
        "message": "Stolckr API",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "running"
    }

# Vercel handler
def handler(request, context):
    from mangum import Mangum
    asgi_handler = Mangum(app)
    return asgi_handler(request, context)