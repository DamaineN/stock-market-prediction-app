#!/usr/bin/env python3
"""
Test script for ML prediction models
"""
import asyncio
import logging
from models.model_manager import ModelManager
from api.collectors.yahoo_finance import YahooFinanceCollector

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_models():
    """Test all prediction models"""
    try:
        # Initialize components
        model_manager = ModelManager()
        data_collector = YahooFinanceCollector()
        
        # Test symbol
        symbol = "AAPL"
        logger.info(f"Testing models with {symbol}")
        
        # Get historical data
        logger.info("Fetching historical data...")
        historical_data = await data_collector.get_historical_data(symbol, period="1y", interval="1d")
        
        if not historical_data:
            logger.error("Failed to fetch historical data")
            return
        
        logger.info(f"Got {len(historical_data)} days of historical data")
        logger.info(f"Last price: ${historical_data[-1]['close']:.2f}")
        
        # Test each model individually
        models_to_test = ["Random Forest", "XGBoost", "SVR"]
        
        for model_name in models_to_test:
            logger.info(f"\n{'='*50}")
            logger.info(f"Testing {model_name} model")
            logger.info(f"{'='*50}")
            
            try:
                result = await model_manager.get_single_prediction(
                    model_name=model_name,
                    symbol=symbol,
                    historical_data=historical_data,
                    prediction_days=7,  # Test with fewer days
                    confidence_level=0.95
                )
                
                if result["status"] == "completed":
                    predictions = result["predictions"]
                    if predictions:
                        logger.info(f"✅ {model_name} prediction successful!")
                        logger.info(f"   - Generated {len(predictions)} predictions")
                        logger.info(f"   - First prediction: ${predictions[0]['predicted_price']:.2f} on {predictions[0]['date']}")
                        logger.info(f"   - Last prediction: ${predictions[-1]['predicted_price']:.2f} on {predictions[-1]['date']}")
                        logger.info(f"   - Accuracy score: {result['metadata'].get('accuracy_score', 'N/A')}")
                        
                        # Check for extreme values
                        last_price = historical_data[-1]['close']
                        extreme_found = False
                        for pred in predictions:
                            pred_price = pred['predicted_price']
                            if pred_price > last_price * 5 or pred_price < last_price * 0.2:
                                logger.warning(f"   ⚠️ Extreme prediction detected: ${pred_price:.2f}")
                                extreme_found = True
                        
                        if not extreme_found:
                            logger.info("   ✅ All predictions within reasonable bounds")
                    else:
                        logger.error(f"❌ {model_name} returned no predictions")
                else:
                    logger.error(f"❌ {model_name} failed: {result.get('metadata', {}).get('error', 'Unknown error')}")
                    
            except Exception as e:
                logger.error(f"❌ Error testing {model_name}: {str(e)}")
        
        # Test ensemble
        logger.info(f"\n{'='*50}")
        logger.info("Testing Ensemble model")
        logger.info(f"{'='*50}")
        
        try:
            ensemble_result = await model_manager.get_ensemble_prediction(
                symbol=symbol,
                historical_data=historical_data,
                prediction_days=7,
                confidence_level=0.95
            )
            
            if ensemble_result["status"] == "completed":
                predictions = ensemble_result["predictions"]
                if predictions:
                    logger.info("✅ Ensemble prediction successful!")
                    logger.info(f"   - Generated {len(predictions)} predictions")
                    logger.info(f"   - Models used: {', '.join(ensemble_result['metadata']['models_used'])}")
                    logger.info(f"   - First prediction: ${predictions[0]['predicted_price']:.2f} on {predictions[0]['date']}")
                    logger.info(f"   - Ensemble accuracy: {ensemble_result['metadata'].get('ensemble_accuracy', 'N/A')}")
                else:
                    logger.error("❌ Ensemble returned no predictions")
            else:
                logger.error(f"❌ Ensemble failed: {ensemble_result.get('metadata', {}).get('error', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"❌ Error testing ensemble: {str(e)}")
        
        logger.info(f"\n{'='*50}")
        logger.info("Model testing completed")
        logger.info(f"{'='*50}")
        
    except Exception as e:
        logger.error(f"Fatal error in model testing: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_models())