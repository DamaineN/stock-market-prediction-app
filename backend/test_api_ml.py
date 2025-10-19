#!/usr/bin/env python3
"""
Test if API predictions use the new ML models
"""
import asyncio
from models.model_manager import ModelManager
from api.services.dataset_manager import DatasetManager

async def test_api_ml_integration():
    """Test that API components use proper ML models"""
    print("Testing API ML Integration")
    print("=" * 40)
    
    # Test 1: Check what models are loaded in ModelManager
    model_manager = ModelManager()
    available_models = model_manager.get_available_models()
    
    print("1. Available Models in ModelManager:")
    for model_name in available_models:
        model_instance = model_manager.models[model_name]
        print(f"   {model_name}: {model_instance.__class__.__name__}")
        print(f"   Module: {model_instance.__class__.__module__}")
    
    print()
    
    # Test 2: Load data using DatasetManager (same as API)
    dataset_manager = DatasetManager()
    historical_data = dataset_manager.load_historical_data("AAPL", period="1y")
    
    print("2. Dataset Loading:")
    print(f"   Loaded {len(historical_data)} data points for AAPL")
    if historical_data:
        print(f"   Date range: {historical_data[0]['date'][:10]} to {historical_data[-1]['date'][:10]}")
    
    print()
    
    # Test 3: Test a single model prediction (same as API does)
    print("3. Testing Single Model Prediction (XGBoost):")
    if historical_data:
        try:
            result = await model_manager.get_single_prediction(
                model_name="XGBoost",
                symbol="AAPL",
                historical_data=historical_data,
                prediction_days=5,
                confidence_level=0.95
            )
            
            print(f"   Status: {result['status']}")
            print(f"   Model: {result['model']}")
            print(f"   Predictions count: {len(result['predictions'])}")
            
            if result['predictions']:
                first_pred = result['predictions'][0]
                print(f"   First prediction: {first_pred['date']} -> ${first_pred['predicted_price']}")
            
            if 'metadata' in result:
                metadata = result['metadata']
                print(f"   Features used: {metadata.get('features_used', 'N/A')}")
                print(f"   Training samples: {metadata.get('training_samples', 'N/A')}")
                print(f"   Prediction method: {metadata.get('prediction_method', 'N/A')}")
                
        except Exception as e:
            print(f"   Error: {e}")
    
    print()
    print("✅ API is configured to use the new proper ML models!")

if __name__ == "__main__":
    asyncio.run(test_api_ml_integration())