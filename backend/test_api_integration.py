#!/usr/bin/env python3
"""
Test API Integration with Datasets
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

async def test_api_routes():
    """Test the API routes that use DatasetManager"""
    print("Testing API Integration with Datasets")
    print("=" * 40)
    
    # Import the necessary modules
    try:
        from api.routes.stocks import search_stocks, get_stock_info
        from api.routes.predictions import get_available_models
        from api.services.dataset_manager import DatasetManager
        print("✅ All modules imported successfully")
    except Exception as e:
        print(f"❌ Import error: {e}")
        return
    
    # Test 1: Search stocks API function
    print("\n1. Testing stock search API:")
    try:
        # Simulate API call parameters
        class MockQuery:
            def __init__(self, value):
                self.value = value
        
        # Test search
        search_result = await search_stocks(
            query="AAPL",
            limit=5
        )
        
        print(f"   ✅ Search returned: {search_result['count']} results")
        print(f"   Available stocks only: {search_result['available_stocks_only']}")
        for result in search_result['results'][:3]:
            print(f"   - {result['symbol']}: {result['name']}")
        
    except Exception as e:
        print(f"   ❌ Search API error: {e}")
    
    # Test 2: Stock info API function  
    print("\n2. Testing stock info API:")
    try:
        stock_info = await get_stock_info("AAPL")
        print(f"   ✅ AAPL info: {stock_info.name} - ${stock_info.price}")
        print(f"   Sector: {stock_info.sector}, Industry: {stock_info.industry}")
        
    except Exception as e:
        print(f"   ❌ Stock info API error: {e}")
    
    # Test 3: Available models
    print("\n3. Testing prediction models API:")
    try:
        models_result = await get_available_models()
        print(f"   ✅ Available models: {len(models_result['available_models'])}")
        for model in models_result['available_models']:
            print(f"   - {model}")
        
    except Exception as e:
        print(f"   ❌ Models API error: {e}")
    
    # Test 4: Direct DatasetManager functionality
    print("\n4. Testing DatasetManager integration:")
    try:
        manager = DatasetManager()
        
        # Test historical data loading
        data = manager.load_historical_data("TSLA", "3mo", "1d")
        if data:
            print(f"   ✅ TSLA historical data: {len(data)} points")
            print(f"   Date range: {data[0]['date']} to {data[-1]['date']}")
            latest_price = data[-1]['close']
            print(f"   Latest price: ${latest_price:.2f}")
        else:
            print("   ❌ No historical data returned")
            
    except Exception as e:
        print(f"   ❌ DatasetManager error: {e}")
    
    print("\n🎉 API integration testing complete!")

if __name__ == "__main__":
    asyncio.run(test_api_routes())