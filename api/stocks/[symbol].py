from http.server import BaseHTTPRequestHandler
import json
import requests
from datetime import datetime
from urllib.parse import urlparse, parse_qs

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        try:
            # Parse URL to get symbol
            url_parts = urlparse(self.path)
            path_parts = url_parts.path.strip('/').split('/')
            
            # Extract symbol from path like /api/stocks/AAPL
            if len(path_parts) >= 3 and path_parts[1] == 'stocks':
                symbol = path_parts[2].upper()
            else:
                self.send_error_response(400, "Invalid URL format")
                return
            
            # Parse query parameters
            query_params = parse_qs(url_parts.query)
            endpoint_type = query_params.get('type', ['info'])[0]
            
            if endpoint_type == 'historical':
                self.handle_historical_data(symbol, query_params)
            else:
                self.handle_stock_info(symbol)
                
        except Exception as e:
            self.send_error_response(500, f"Server error: {str(e)}")
    
    def handle_stock_info(self, symbol):
        try:
            # Mock stock data for demo (in production, use real API)
            mock_stocks = {
                "AAPL": {"name": "Apple Inc.", "sector": "Technology", "industry": "Consumer Electronics", "market_cap": 3000000000, "price": 150.25},
                "GOOGL": {"name": "Alphabet Inc.", "sector": "Technology", "industry": "Internet Services", "market_cap": 2000000000, "price": 2800.50},
                "MSFT": {"name": "Microsoft Corporation", "sector": "Technology", "industry": "Software", "market_cap": 2800000000, "price": 420.75},
                "TSLA": {"name": "Tesla, Inc.", "sector": "Consumer Cyclical", "industry": "Auto Manufacturers", "market_cap": 800000000, "price": 250.30}
            }
            
            if symbol not in mock_stocks:
                self.send_error_response(404, f"Stock information not found for {symbol}")
                return
            
            stock_data = mock_stocks[symbol]
            response = {
                "symbol": symbol,
                "name": stock_data["name"],
                "sector": stock_data["sector"],
                "industry": stock_data["industry"],
                "market_cap": stock_data["market_cap"],
                "price": stock_data["price"]
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_error_response(500, f"Error fetching stock info: {str(e)}")
    
    def handle_historical_data(self, symbol, query_params):
        try:
            period = query_params.get('period', ['1y'])[0]
            interval = query_params.get('interval', ['1d'])[0]
            
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)
            
            if hist.empty:
                self.send_error_response(404, f"No data found for symbol {symbol}")
                return
            
            # Convert to list of dictionaries
            data = []
            for index, row in hist.iterrows():
                data.append({
                    "date": index.strftime("%Y-%m-%d") if hasattr(index, 'strftime') else str(index),
                    "open": float(row['Open']) if pd.notna(row['Open']) else None,
                    "high": float(row['High']) if pd.notna(row['High']) else None,
                    "low": float(row['Low']) if pd.notna(row['Low']) else None,
                    "close": float(row['Close']) if pd.notna(row['Close']) else None,
                    "volume": int(row['Volume']) if pd.notna(row['Volume']) else None
                })
            
            response = {
                "symbol": symbol,
                "data": data,
                "metadata": {
                    "period": period,
                    "interval": interval,
                    "count": len(data),
                    "last_updated": datetime.utcnow().isoformat(),
                    "source": "Yahoo Finance"
                }
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_error_response(500, f"Error fetching historical data: {str(e)}")
    
    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        error_response = {"error": message}
        self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()