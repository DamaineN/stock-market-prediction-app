#!/usr/bin/env python3
"""
Debug feature shape issues in ML models
"""
import pandas as pd
import numpy as np
from models.ensemble.proper_ml_models import ProperXGBoostPredictor
from api.services.dataset_manager import DatasetManager

def debug_feature_shapes():
    """Debug what's causing the feature shape mismatch"""
    print("Debugging Feature Shapes")
    print("=" * 40)
    
    # Load data
    dataset_manager = DatasetManager()
    historical_data = dataset_manager.load_historical_data("AAPL", period="1y")
    
    print(f"Historical data loaded: {len(historical_data)} points")
    
    # Convert to DataFrame
    df = pd.DataFrame(historical_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)
    
    print(f"DataFrame shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    
    # Test the XGBoost model directly
    model = ProperXGBoostPredictor()
    print(f"Lookback days: {model.lookback_days}")
    
    try:
        # Test feature creation
        df_features = model._create_technical_features(df)
        print(f"Features created, shape: {df_features.shape}")
        print(f"Feature columns: {len(df_features.columns)}")
        
        # Test sequence preparation
        X, y, valid_features = model._prepare_sequences(df)
        print(f"Sequences created successfully!")
        print(f"X shape: {X.shape}")
        print(f"y shape: {y.shape}")
        print(f"Valid features count: {len(valid_features)}")
        print(f"Features per timestep: {len(valid_features)}")
        print(f"Expected total features: {len(valid_features) * model.lookback_days}")
        
        # Test model training
        if len(X) > 0:
            X_scaled = model.scaler.fit_transform(X)
            print(f"X scaled shape: {X_scaled.shape}")
            
            trained_model = model._train_model(X_scaled, y)
            print(f"Model trained successfully!")
            
            # Test prediction
            test_features = X_scaled[-1:]
            pred = model._predict_next_price(trained_model, test_features)
            print(f"Test prediction: ${pred:.2f}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_feature_shapes()