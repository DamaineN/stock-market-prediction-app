"""
Vercel serverless handler for FastAPI backend
"""
import os
import sys

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Import the FastAPI app
from backend.main import app
from mangum import Mangum

# Create the Vercel handler
handler = Mangum(app, lifespan="off")

# For debugging
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)