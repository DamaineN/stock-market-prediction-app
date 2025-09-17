"""
ML Prediction API routes
"""
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import asyncio

from models.lstm.predictor import LSTMPredictor
from models.arima.predictor import ARIMAPredictor
from models.ensemble.predictor import EnsemblePredictor
from api.collectors.yahoo_finance import YahooFinanceCollector

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
    \"\"\"Generate stock price predictions using specified model\"\"\"
    try:
        # Validate model type
        valid_models = ["lstm", "arima", "ensemble", "all"]
        if request.model_type not in valid_models:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid model type. Choose from: {valid_models}"
            )
        
        results = {}
        
        if request.model_type == "lstm" or request.model_type == "all":
            lstm_predictor = LSTMPredictor()
            lstm_result = await lstm_predictor.predict(
                request.symbol,
                request.prediction_days,
                request.confidence_level
            )
            results["lstm"] = lstm_result
        
        if request.model_type == "arima" or request.model_type == "all":
            arima_predictor = ARIMAPredictor()
            arima_result = await arima_predictor.predict(
                request.symbol,
                request.prediction_days,
                request.confidence_level
            )
            results["arima"] = arima_result
        
        if request.model_type == "ensemble" or request.model_type == "all":
            ensemble_predictor = EnsemblePredictor()
            ensemble_result = await ensemble_predictor.predict(
                request.symbol,
                request.prediction_days,
                request.confidence_level
            )
            results["ensemble"] = ensemble_result
        
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
    \"\"\"Get cached predictions for a symbol\"\"\"
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
    \"\"\"Train a model on historical data\"\"\"
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
    \"\"\"Get status of all trained models\"\"\"
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
    \"\"\"Backtest model performance on historical data\"\"\"
    try:
        if model_type == "lstm":
            predictor = LSTMPredictor()
        elif model_type == "arima":
            predictor = ARIMAPredictor()
        elif model_type == "ensemble":
            predictor = EnsemblePredictor()
        else:
            raise HTTPException(status_code=400, detail="Invalid model type")
        
        # Perform backtesting
        backtest_results = await predictor.backtest(
            symbol.upper(),
            test_period,
            train_period
        )
        
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
    \"\"\"Background task for model training\"\"\"
    try:
        if model_type == "lstm":
            predictor = LSTMPredictor()
        elif model_type == "arima":
            predictor = ARIMAPredictor()
        elif model_type == "ensemble":
            predictor = EnsemblePredictor()
        else:
            return
        
        await predictor.train(symbol, training_period, parameters)
        print(f"✅ Model {model_type} training completed for {symbol}")
        
    except Exception as e:
        print(f"❌ Model training failed for {symbol}: {str(e)}")
