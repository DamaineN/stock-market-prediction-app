#!/usr/bin/env python3
"""
Model Diagnostics - Check if models are working properly with real data
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from models.model_manager import ModelManager
import asyncio

async def diagnose_model_behavior():
    """Diagnose model behavior with real data"""
    print("Model Diagnostics")
    print("=" * 50)
    
    # Load real data
    data_path = "data/historical_datasets/AAPL.csv"
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    print(f"Dataset info:")
    print(f"  Shape: {df.shape}")
    print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"  Price range: ${df['close'].min():.2f} to ${df['close'].max():.2f}")
    print(f"  Columns: {list(df.columns)}")
    
    # Check for data quality issues
    print(f"\nData Quality:")
    print(f"  Missing values: {df.isnull().sum().sum()}")
    print(f"  Zero prices: {(df['close'] <= 0).sum()}")
    print(f"  Duplicate dates: {df['date'].duplicated().sum()}")
    
    # Analyze price patterns
    df['daily_return'] = df['close'].pct_change()
    print(f"\nPrice Patterns:")
    print(f"  Mean daily return: {df['daily_return'].mean():.4f}")
    print(f"  Volatility (std): {df['daily_return'].std():.4f}")
    print(f"  Min return: {df['daily_return'].min():.4f}")
    print(f"  Max return: {df['daily_return'].max():.4f}")
    
    # Test with model manager
    historical_data = df.to_dict('records')
    manager = ModelManager()
    
    print(f"\n" + "="*50)
    print("Testing Single Model Prediction:")
    
    # Test LSTM model
    print("\nTesting LSTM model...")
    lstm_result = await manager.get_single_prediction(
        model_name="LSTM",
        symbol="AAPL", 
        historical_data=historical_data[-100:],  # Use last 100 days
        prediction_days=5
    )
    
    print(f"LSTM Result:")
    print(f"  Status: {lstm_result['status']}")
    print(f"  Predictions count: {len(lstm_result['predictions'])}")
    if lstm_result['predictions']:
        print(f"  First prediction: {lstm_result['predictions'][0]}")
        print(f"  Last actual price: ${df['close'].iloc[-1]:.2f}")
        print(f"  First predicted price: ${lstm_result['predictions'][0]['predicted_price']:.2f}")
    
    # Test simpler model
    print("\nTesting Linear Regression model...")
    lr_result = await manager.get_single_prediction(
        model_name="Linear Regression",
        symbol="AAPL",
        historical_data=historical_data[-100:],
        prediction_days=5
    )
    
    print(f"Linear Regression Result:")
    print(f"  Status: {lr_result['status']}")
    print(f"  Predictions count: {len(lr_result['predictions'])}")
    if lr_result['predictions']:
        print(f"  First prediction: {lr_result['predictions'][0]}")
        print(f"  First predicted price: ${lr_result['predictions'][0]['predicted_price']:.2f}")
    
    # Simple backtest on a small window
    print(f"\n" + "="*50)
    print("Simple Backtest Analysis:")
    
    # Split data for simple analysis
    split_idx = len(df) - 10  # Use last 10 days for testing
    train_data = df[:split_idx]
    test_data = df[split_idx:]
    
    print(f"Train period: {train_data['date'].min()} to {train_data['date'].max()}")
    print(f"Test period: {test_data['date'].min()} to {test_data['date'].max()}")
    
    # Simple trend calculation
    recent_prices = train_data['close'].tail(30).values
    trend = np.polyfit(range(len(recent_prices)), recent_prices, 1)[0]
    last_price = recent_prices[-1]
    
    print(f"Simple Analysis:")
    print(f"  Last training price: ${last_price:.2f}")
    print(f"  Daily trend: ${trend:.4f}")
    print(f"  30-day volatility: ${train_data['close'].tail(30).std():.2f}")
    
    # Compare with actual test prices
    actual_test_prices = test_data['close'].values
    simple_predictions = [last_price + (trend * i) for i in range(1, len(actual_test_prices) + 1)]
    
    mae = np.mean(np.abs(np.array(simple_predictions) - actual_test_prices))
    mape = np.mean(np.abs((actual_test_prices - simple_predictions) / actual_test_prices)) * 100
    
    print(f"Simple Linear Trend Performance:")
    print(f"  MAE: {mae:.2f}")
    print(f"  MAPE: {mape:.2f}%")
    print(f"  Test prices: {[f'${p:.2f}' for p in actual_test_prices]}")
    print(f"  Predictions: {[f'${p:.2f}' for p in simple_predictions]}")

if __name__ == "__main__":
    asyncio.run(diagnose_model_behavior())