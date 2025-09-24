"""
Simple Moving Average predictor for stock prices
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)

class MovingAveragePredictor:
    """Simple Moving Average based stock price predictor"""
    
    def __init__(self, short_window: int = 10, long_window: int = 30):
        self.short_window = short_window
        self.long_window = long_window
        self.model_name = "Moving Average"
        
    async def predict(
        self, 
        symbol: str, 
        historical_data: List[Dict[str, Any]], 
        prediction_days: int = 30,
        confidence_level: float = 0.95
    ) -> Dict[str, Any]:
        """
        Generate predictions using moving averages
        
        Args:
            symbol: Stock symbol
            historical_data: List of historical price data
            prediction_days: Number of days to predict
            confidence_level: Confidence level for predictions
            
        Returns:
            Dictionary containing predictions and metadata
        """
        try:
            if len(historical_data) < self.long_window:
                raise ValueError(f"Need at least {self.long_window} days of historical data")
            
            # Convert to DataFrame for easier manipulation
            df = pd.DataFrame(historical_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Calculate moving averages
            df['short_ma'] = df['close'].rolling(window=self.short_window).mean()
            df['long_ma'] = df['close'].rolling(window=self.long_window).mean()
            
            # Calculate trend
            recent_short_ma = df['short_ma'].iloc[-5:].mean()
            recent_long_ma = df['long_ma'].iloc[-5:].mean()
            
            # Determine trend direction
            if recent_short_ma > recent_long_ma:
                trend = "bullish"
                trend_factor = 1.02  # Slight upward bias
            elif recent_short_ma < recent_long_ma:
                trend = "bearish" 
                trend_factor = 0.98  # Slight downward bias
            else:
                trend = "neutral"
                trend_factor = 1.0
            
            # Get recent price and volatility
            recent_prices = df['close'].iloc[-10:].values
            recent_price = recent_prices[-1]
            volatility = np.std(recent_prices) / np.mean(recent_prices)
            
            # Generate predictions
            predictions = []
            last_date = df['date'].iloc[-1]
            
            for i in range(1, prediction_days + 1):
                pred_date = last_date + timedelta(days=i)
                
                # Simple prediction: recent price adjusted by trend and some random walk
                daily_change = np.random.normal(0, volatility) * 0.5  # Reduced volatility for prediction
                predicted_price = recent_price * (trend_factor ** (i/30)) * (1 + daily_change)
                
                # Calculate confidence interval (simplified)
                confidence_margin = volatility * recent_price * 1.96 * np.sqrt(i/30)  # Increases with time
                lower_bound = max(0, predicted_price - confidence_margin)
                upper_bound = predicted_price + confidence_margin
                
                predictions.append({
                    "date": pred_date.strftime("%Y-%m-%d"),
                    "predicted_price": round(float(predicted_price), 2),
                    "lower_bound": round(float(lower_bound), 2),
                    "upper_bound": round(float(upper_bound), 2),
                    "confidence": confidence_level
                })
            
            # Calculate some basic metrics
            accuracy_score = self._calculate_mock_accuracy(df)
            
            return {
                "symbol": symbol,
                "model": self.model_name,
                "predictions": predictions,
                "metadata": {
                    "short_window": self.short_window,
                    "long_window": self.long_window,
                    "trend": trend,
                    "trend_factor": trend_factor,
                    "volatility": round(float(volatility), 4),
                    "accuracy_score": accuracy_score,
                    "data_points_used": len(df),
                    "last_price": round(float(recent_price), 2),
                    "prediction_method": "Simple Moving Average with trend analysis"
                },
                "status": "completed",
                "created_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in moving average prediction for {symbol}: {str(e)}")
            return {
                "symbol": symbol,
                "model": self.model_name,
                "predictions": [],
                "metadata": {"error": str(e)},
                "status": "failed",
                "created_at": datetime.utcnow().isoformat()
            }
    
    def _calculate_mock_accuracy(self, df: pd.DataFrame) -> float:
        """Calculate a mock accuracy score based on trend consistency"""
        if len(df) < 20:
            return 0.75  # Default accuracy
        
        # Check how often short MA correctly predicted direction
        df['short_ma_change'] = df['short_ma'].diff()
        df['price_change'] = df['close'].diff()
        
        # Count correct direction predictions
        correct_predictions = ((df['short_ma_change'] > 0) & (df['price_change'] > 0)).sum() + \
                            ((df['short_ma_change'] < 0) & (df['price_change'] < 0)).sum()
        
        total_predictions = len(df) - 1  # Exclude first row (NaN diff)
        accuracy = correct_predictions / total_predictions if total_predictions > 0 else 0.75
        
        return round(float(np.clip(accuracy, 0.6, 0.9)), 3)  # Clamp between 60% and 90%
    
    async def backtest(
        self, 
        symbol: str, 
        historical_data: List[Dict[str, Any]], 
        test_days: int = 30
    ) -> Dict[str, Any]:
        """
        Backtest the moving average strategy
        
        Args:
            symbol: Stock symbol
            historical_data: Historical price data
            test_days: Number of days to backtest
            
        Returns:
            Backtesting results
        """
        try:
            if len(historical_data) < self.long_window + test_days:
                raise ValueError(f"Need at least {self.long_window + test_days} days for backtesting")
            
            df = pd.DataFrame(historical_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date').reset_index(drop=True)
            
            # Split data for backtesting
            train_data = df[:-test_days].copy()
            test_data = df[-test_days:].copy()
            
            # Calculate moving averages on training data
            train_data['short_ma'] = train_data['close'].rolling(window=self.short_window).mean()
            train_data['long_ma'] = train_data['close'].rolling(window=self.long_window).mean()
            
            # Generate predictions for test period
            predictions = []
            actual_values = []
            
            for i, row in test_data.iterrows():
                # Use trend from training data to predict
                recent_trend = train_data['short_ma'].iloc[-5:].mean() / train_data['long_ma'].iloc[-5:].mean()
                base_price = train_data['close'].iloc[-1]
                
                # Simple prediction
                predicted_price = base_price * (recent_trend ** (i/30))
                predictions.append(predicted_price)
                actual_values.append(row['close'])
            
            # Calculate metrics
            predictions = np.array(predictions)
            actual_values = np.array(actual_values)
            
            mse = np.mean((predictions - actual_values) ** 2)
            rmse = np.sqrt(mse)
            mae = np.mean(np.abs(predictions - actual_values))
            mape = np.mean(np.abs((actual_values - predictions) / actual_values)) * 100
            
            # Direction accuracy
            pred_directions = np.diff(predictions) > 0
            actual_directions = np.diff(actual_values) > 0
            direction_accuracy = np.mean(pred_directions == actual_directions) if len(pred_directions) > 0 else 0.5
            
            return {
                "symbol": symbol,
                "model": self.model_name,
                "test_period": test_days,
                "metrics": {
                    "mse": round(float(mse), 4),
                    "rmse": round(float(rmse), 4),
                    "mae": round(float(mae), 4),
                    "mape": round(float(mape), 2),
                    "direction_accuracy": round(float(direction_accuracy), 3)
                },
                "predictions_vs_actual": [
                    {
                        "date": test_data.iloc[i]['date'].strftime("%Y-%m-%d"),
                        "predicted": round(float(predictions[i]), 2),
                        "actual": round(float(actual_values[i]), 2),
                        "error": round(float(abs(predictions[i] - actual_values[i])), 2)
                    }
                    for i in range(len(predictions))
                ],
                "status": "completed"
            }
            
        except Exception as e:
            logger.error(f"Error in backtesting for {symbol}: {str(e)}")
            return {
                "symbol": symbol,
                "model": self.model_name,
                "error": str(e),
                "status": "failed"
            }
