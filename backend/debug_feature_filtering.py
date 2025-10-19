#!/usr/bin/env python3
"""
Debug why features are being filtered out in _prepare_sequences
"""
import pandas as pd
import numpy as np
from models.ensemble.proper_ml_models import ProperXGBoostPredictor
from api.services.dataset_manager import DatasetManager

def debug_feature_filtering():
    """Debug the feature filtering process"""
    print("Debugging Feature Filtering")
    print("=" * 40)
    
    # Load data
    dataset_manager = DatasetManager()
    historical_data = dataset_manager.load_historical_data("AAPL", period="1y")
    
    # Convert to DataFrame
    df = pd.DataFrame(historical_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)
    
    print(f"DataFrame shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    
    # Test the XGBoost model directly
    model = ProperXGBoostPredictor()
    
    # Create features step by step
    print("\n1. Creating technical features...")
    df_features = model._create_technical_features(df)
    print(f"Features DataFrame shape: {df_features.shape}")
    print(f"Total columns: {len(df_features.columns)}")
    
    # Check feature columns
    print("\n2. Analyzing feature columns...")
    feature_cols = [col for col in df_features.columns 
                   if col not in ['date', 'open', 'high', 'low', 'close', 'volume']
                   and df_features[col].dtype in ['float64', 'int64']]
    
    print(f"Feature columns found: {len(feature_cols)}")
    print("First 10 feature columns:", feature_cols[:10])
    
    # Check for invalid features
    print("\n3. Checking feature validity...")
    valid_features = []
    invalid_features = []
    
    for col in feature_cols:
        series = df_features[col]
        has_all_nan = series.isna().all()
        has_all_inf = (series.replace([np.inf, -np.inf], np.nan).isna().all())
        
        if has_all_nan or has_all_inf:
            invalid_features.append(col)
            print(f"  INVALID: {col} - all_nan: {has_all_nan}, all_inf: {has_all_inf}")
        else:
            valid_features.append(col)
    
    print(f"\nValid features: {len(valid_features)}")
    print(f"Invalid features: {len(invalid_features)}")
    
    if len(valid_features) > 0:
        print("First 5 valid features:", valid_features[:5])
        
        # Test data preparation
        print("\n4. Testing data preparation...")
        try:
            # Fill NaN values
            df_features[valid_features] = df_features[valid_features].fillna(method='ffill').fillna(method='bfill').fillna(0)
            df_features[valid_features] = df_features[valid_features].replace([np.inf, -np.inf], 0)
            
            print("Data filling successful")
            
            # Test sequence creation
            print("5. Testing sequence creation...")
            X, y = [], []
            lookback_days = model.lookback_days
            
            for i in range(lookback_days, len(df_features)):
                sequence_features = df_features[valid_features].iloc[i-lookback_days:i].values
                sequence = sequence_features.flatten()
                X.append(sequence)
                y.append(df_features['close'].iloc[i])
            
            X = np.array(X)
            y = np.array(y)
            
            print(f"X shape: {X.shape}")
            print(f"y shape: {y.shape}")
            print(f"Features per timestep: {len(valid_features)}")
            print(f"Total features per sequence: {len(valid_features) * lookback_days}")
            
            if len(X) > 0:
                print("✅ Sequence creation successful!")
            else:
                print("❌ No sequences created")
                
        except Exception as e:
            print(f"❌ Error in data preparation: {e}")
            import traceback
            traceback.print_exc()
    
    else:
        print("❌ No valid features found!")
        print("Checking sample feature values...")
        for col in feature_cols[:5]:
            series = df_features[col]
            print(f"  {col}:")
            print(f"    Type: {series.dtype}")
            print(f"    NaN count: {series.isna().sum()}")
            print(f"    Inf count: {(series == np.inf).sum()}")
            print(f"    Sample values: {series.head().tolist()}")

if __name__ == "__main__":
    debug_feature_filtering()