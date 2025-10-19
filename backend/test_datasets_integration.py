#!/usr/bin/env python3
"""
Test Dataset Manager Integration
Verify that the dataset manager can load and use the fixed datasets
"""
import sys
sys.path.append('api/services')

from dataset_manager import DatasetManager

def test_dataset_manager():
    """Test the dataset manager with fixed datasets"""
    print("Testing Dataset Manager Integration")
    print("=" * 40)
    
    # Initialize dataset manager
    dm = DatasetManager()
    
    # Test 1: Get available stocks
    print("1. Testing get_available_stocks():")
    stocks = dm.get_available_stocks()
    print(f"   Found {len(stocks)} stocks:")
    for stock in stocks:
        status = "✅" if stock['has_dataset'] else "❌"
        print(f"   {status} {stock['symbol']}: {stock['name']} ({stock['sector']})")
    
    print()
    
    # Test 2: Test loading historical data for stocks with datasets
    print("2. Testing load_historical_data():")
    for stock in stocks:
        if stock['has_dataset']:
            symbol = stock['symbol']
            try:
                data = dm.load_historical_data(symbol, period="1mo")
                print(f"   ✅ {symbol}: Loaded {len(data)} data points")
                if data:
                    print(f"      Date range: {data[0]['date'][:10]} to {data[-1]['date'][:10]}")
                    print(f"      Price range: ${data[-1]['close']:.2f}")
            except Exception as e:
                print(f"   ❌ {symbol}: Error loading data - {e}")
    
    print()
    
    # Test 3: Test stock info retrieval
    print("3. Testing get_stock_info():")
    test_symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA']
    for symbol in test_symbols:
        try:
            info = dm.get_stock_info(symbol)
            if info:
                current_price = info.get('currentPrice', 'N/A')
                print(f"   ✅ {symbol}: {info['longName']} - Current: ${current_price}")
            else:
                print(f"   ❌ {symbol}: No info found")
        except Exception as e:
            print(f"   ❌ {symbol}: Error getting info - {e}")
    
    print()
    
    # Test 4: Test search functionality
    print("4. Testing search_stocks():")
    search_queries = ['AAPL', 'Tesla', 'Microsoft']
    for query in search_queries:
        try:
            results = dm.search_stocks(query, limit=3)
            print(f"   Search '{query}': Found {len(results)} results")
            for result in results:
                status = "✅" if result['has_dataset'] else "❌"
                print(f"     {status} {result['symbol']}: {result['name']}")
        except Exception as e:
            print(f"   ❌ Search '{query}': Error - {e}")
    
    print()
    print("Dataset Manager Integration Test Complete!")

if __name__ == "__main__":
    test_dataset_manager()