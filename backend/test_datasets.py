#!/usr/bin/env python3
"""
Test script for DatasetManager functionality
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from api.services.dataset_manager import DatasetManager

def test_dataset_manager():
    """Test all DatasetManager functionality"""
    print("Testing DatasetManager")
    print("=" * 30)
    
    # Initialize DatasetManager
    manager = DatasetManager()
    
    # Test 1: Get available stocks
    print("1. Testing get_available_stocks():")
    stocks = manager.get_available_stocks()
    print(f"   Found {len(stocks)} available stocks:")
    for stock in stocks:
        status = "✅" if stock["has_dataset"] else "❌"
        print(f"   {status} {stock['symbol']}: {stock['name']}")
    print()
    
    # Test 2: Test search functionality
    print("2. Testing search_stocks():")
    search_results = manager.search_stocks("APP", 5)
    print(f"   Search for 'APP' returned {len(search_results)} results:")
    for result in search_results:
        print(f"   - {result['symbol']}: {result['name']}")
    print()
    
    # Test 3: Get stock info for each available symbol
    print("3. Testing get_stock_info() for each symbol:")
    symbols_with_data = [stock['symbol'] for stock in stocks if stock['has_dataset']]
    
    for symbol in symbols_with_data:
        info = manager.get_stock_info(symbol)
        if info:
            price = info.get('currentPrice', 'N/A')
            print(f"   ✅ {symbol}: {info['longName']} - ${price}")
        else:
            print(f"   ❌ {symbol}: Failed to get info")
    print()
    
    # Test 4: Load historical data samples
    print("4. Testing load_historical_data():")
    test_symbols = symbols_with_data[:3]  # Test first 3 symbols
    
    for symbol in test_symbols:
        try:
            data = manager.load_historical_data(symbol, "1mo", "1d")
            if data:
                print(f"   ✅ {symbol}: {len(data)} data points")
                print(f"      Date range: {data[0]['date']} to {data[-1]['date']}")
                print(f"      Price range: ${min(d['close'] for d in data):.2f} - ${max(d['close'] for d in data):.2f}")
            else:
                print(f"   ❌ {symbol}: No data returned")
        except Exception as e:
            print(f"   ❌ {symbol}: Error - {e}")
    print()
    
    # Test 5: Test empty search (should return all stocks)
    print("5. Testing empty search (should return all available stocks):")
    all_results = manager.search_stocks("", 10)
    print(f"   Empty search returned {len(all_results)} stocks:")
    for result in all_results:
        print(f"   - {result['symbol']}: {result['name']}")
    print()
    
    print("🎉 DatasetManager testing complete!")
    print(f"📊 Summary: {len(symbols_with_data)}/10 stocks have working datasets")

if __name__ == "__main__":
    test_dataset_manager()