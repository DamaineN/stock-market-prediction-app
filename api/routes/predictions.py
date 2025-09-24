"""
ML Prediction API routes
"""
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import asyncio

from models.basic.moving_average import MovingAveragePredictor
from api.collectors.yahoo_finance import YahooFinanceCollector
# More advanced models can be added later
# from models.lstm.predictor import LSTMPredictor
# from models.arima.predictor import ARIMAPredictor
# from models.ensemble.predictor import EnsemblePredictor

router = APIRouter()

class PredictionRequest(BaseModel):
    symbol: str
    model_type: str  # "lstm", "arima", "ensemble", "all"
    prediction_days: int = 30
    confidence_level: float = 0.95

class PredictionResponse(BaseModel):
    symbol: str
    model_type: str
    predictions: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    created_at: str

class ModelTrainingRequest(BaseModel):
    symbol: str
    model_type: str
    training_period: str = "2y"
    parameters: Optional[Dict[str, Any]] = None

@router.post("/predictions/predict")
async def create_prediction(request: PredictionRequest):
    """Generate stock price predictions using specified model"""
    try:
        # This validation is now done after getting historical data
        
        results = {}
        
        # Get historical data for the symbol
        data_collector = YahooFinanceCollector()
        historical_data = await data_collector.get_historical_data(
            request.symbol, 
            period="1y",  # Get 1 year of data for better predictions
            interval="1d"
        )
        
        if not historical_data:
            raise HTTPException(
                status_code=404,
                detail=f"No historical data available for symbol {request.symbol}"
            )
        
        # Update valid models to include moving_average
        valid_models = ["moving_average", "lstm", "arima", "ensemble", "all"]
        if request.model_type not in valid_models:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid model type. Choose from: {valid_models}"
            )
        
        # Generate predictions based on requested model
        if request.model_type == "moving_average" or request.model_type == "all":
            predictor = MovingAveragePredictor()
            ma_result = await predictor.predict(
                request.symbol,
                historical_data,
                request.prediction_days,
                request.confidence_level
            )
            results["moving_average"] = ma_result
        
        # Placeholder for future ML models
        if request.model_type == "lstm" or request.model_type == "all":
            # TODO: Implement LSTM predictor
            results["lstm"] = {
                "status": "not_implemented",
                "message": "LSTM model coming soon"
            }
        
        if request.model_type == "arima" or request.model_type == "all":
            # TODO: Implement ARIMA predictor
            results["arima"] = {
                "status": "not_implemented", 
                "message": "ARIMA model coming soon"
            }
        
        if request.model_type == "ensemble" or request.model_type == "all":
            # TODO: Implement ensemble predictor
            results["ensemble"] = {
                "status": "not_implemented",
                "message": "Ensemble model coming soon"
            }
        
        return {
            "symbol": request.symbol,
            "model_type": request.model_type,
            "prediction_days": request.prediction_days,
            "results": results,
            "metadata": {
                "confidence_level": request.confidence_level,
                "created_at": datetime.utcnow().isoformat(),
                "models_used": list(results.keys())
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/predictions/{symbol}")
async def get_cached_predictions(
    symbol: str,
    model_type: Optional[str] = Query(default=None, description="Filter by model type"),
    limit: int = Query(default=10, le=100, description="Number of recent predictions to return")
):
    """Get cached predictions for a symbol"""
    try:
        # This would typically query from database
        # For now, return a placeholder response
        return {
            "symbol": symbol.upper(),
            "cached_predictions": [],
            "message": "Cached predictions feature coming soon",
            "model_type": model_type,
            "limit": limit
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cached predictions: {str(e)}")

@router.post("/predictions/train")
async def train_model(request: ModelTrainingRequest, background_tasks: BackgroundTasks):
    """Train a model on historical data"""
    try:
        # Add training task to background
        background_tasks.add_task(
            _train_model_background,
            request.symbol,
            request.model_type,
            request.training_period,
            request.parameters or {}
        )
        
        return {
            "message": f"Training {request.model_type} model for {request.symbol}",
            "symbol": request.symbol,
            "model_type": request.model_type,
            "training_period": request.training_period,
            "status": "training_started",
            "estimated_completion": "15-30 minutes"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training initiation error: {str(e)}")

@router.get("/predictions/models/status")
async def get_model_status():
    """Get status of all trained models"""
    try:
        # This would check model files and training status
        return {
            "models": {
                "lstm": {
                    "status": "not_trained",
                    "last_trained": None,
                    "accuracy": None
                },
                "arima": {
                    "status": "not_trained", 
                    "last_trained": None,
                    "accuracy": None
                },
                "ensemble": {
                    "status": "not_trained",
                    "last_trained": None,
                    "accuracy": None
                }
            },
            "message": "Model status feature coming soon"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching model status: {str(e)}")

@router.get("/predictions/backtest/{symbol}")
async def backtest_model(
    symbol: str,
    model_type: str = Query(description="Model to backtest"),
    test_period: str = Query(default="3mo", description="Backtesting period"),
    train_period: str = Query(default="2y", description="Training period")
):
    """Backtest model performance on historical data"""
    try:
        # Get historical data for backtesting
        data_collector = YahooFinanceCollector()
        historical_data = await data_collector.get_historical_data(
            symbol.upper(), 
            period="2y",  # Get 2 years of data for backtesting
            interval="1d"
        )
        
        if not historical_data:
            raise HTTPException(
                status_code=404,
                detail=f"No historical data available for symbol {symbol}"
            )
        
        # Determine test period in days
        period_days = {
            "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365
        }
        test_days = period_days.get(test_period, 90)  # Default to 3 months
        
        # Create predictor based on model type
        if model_type.lower() == "moving_average":
            predictor = MovingAveragePredictor()
            backtest_results = await predictor.backtest(
                symbol.upper(),
                historical_data,
                test_days
            )
        else:
            # For other models, return not implemented
            backtest_results = {
                "status": "not_implemented",
                "message": f"{model_type} backtesting coming soon",
                "available_models": ["moving_average"]
            }
        
        return {
            "symbol": symbol.upper(),
            "model_type": model_type,
            "test_period": test_period,
            "train_period": train_period,
            "results": backtest_results,
            "metadata": {
                "created_at": datetime.utcnow().isoformat()
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtesting error: {str(e)}")

async def _train_model_background(
    symbol: str,
    model_type: str,
    training_period: str,
    parameters: Dict[str, Any]
):
    """Background task for model training"""
    try:
        # Mock training process until ML models are implemented
        await asyncio.sleep(2)  # Simulate training time
        print(f"✅ Mock training completed for {model_type} model on {symbol}")
        
    except Exception as e:
        print(f"❌ Model training failed for {symbol}: {str(e)}")
