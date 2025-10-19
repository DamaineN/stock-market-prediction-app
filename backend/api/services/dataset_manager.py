"""
Dataset Manager - Loads historical stock data from local CSV files
Provides historical data for predictions without relying on external APIs
"""
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class DatasetManager:
    """Manages local historical stock datasets for offline predictions"""
    
    # Define the 10 available stocks with their info
    AVAILABLE_STOCKS = {
        "AAPL": {
            "name": "Apple Inc.",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "description": "Technology company known for iPhone, iPad, Mac computers"
        },
        "GOOGL": {
            "name": "Alphabet Inc.",
            "sector": "Technology", 
            "industry": "Internet Software & Services",
            "description": "Google's parent company, search engine and cloud services"
        },
        "MSFT": {
            "name": "Microsoft Corporation",
            "sector": "Technology",
            "industry": "Software",
            "description": "Software company known for Windows, Office, Azure cloud services"
        },
        "TSLA": {
            "name": "Tesla, Inc.",
            "sector": "Consumer Discretionary",
            "industry": "Auto Manufacturers",
            "description": "Electric vehicle and clean energy company"
        },
        "AMZN": {
            "name": "Amazon.com Inc.",
            "sector": "Consumer Discretionary",
            "industry": "Internet & Direct Marketing Retail", 
            "description": "E-commerce and cloud computing company"
        },
        "META": {
            "name": "Meta Platforms Inc.",
            "sector": "Technology",
            "industry": "Social Media",
            "description": "Social media company, owns Facebook, Instagram, WhatsApp"
        },
        "NVDA": {
            "name": "NVIDIA Corporation",
            "sector": "Technology",
            "industry": "Semiconductors",
            "description": "Graphics processing and AI computing company"
        },
        "AVGO": {
            "name": "Broadcom Inc.",
            "sector": "Semiconductors & Infrastructure Software",
            "industry": "Technology",
            "description": "Designs, develops and supplies a wide range of semiconductor devices and infrastructure software solutions."
        },
        "BRKB": {
            "name": "Berkshire Hathaway Inc. (Class B shares)",
            "sector": "Holding Company (Diversified Financials)",
            "industry": "Conglomerate", 
            "description": "Diversified holding company whose subsidiaries engage in a wide array of businesses such as insurance and reinsurance, utilities & energy, rail transportation, manufacturing, and retailing."
        },
        "ORCL": {
            "name": "Oracle Corporation",
            "sector": "Technology",
            "industry": "Enterprise Software & Cloud Infrastructure",
            "description": "Global technology company focused on database management systems, enterprise software, cloud infrastructure (IaaS/SaaS), and related hardware and support services."
        }
    }
    
    def __init__(self):
        # Get the backend directory path
        current_dir = Path(__file__).parent.parent.parent  # Go up to backend directory
        self.datasets_dir = current_dir / "data" / "historical_datasets"
        self.datasets_dir.mkdir(parents=True, exist_ok=True)
        
        # Cache for loaded datasets
        self._cache = {}
        
    def get_available_stocks(self) -> List[Dict[str, Any]]:
        """Get list of available stocks with their information"""
        stocks = []
        for symbol, info in self.AVAILABLE_STOCKS.items():
            # Check if dataset file exists
            csv_file = self.datasets_dir / f"{symbol}.csv"
            has_dataset = csv_file.exists()
            
            stocks.append({
                "symbol": symbol,
                "name": info["name"],
                "sector": info["sector"],
                "industry": info["industry"],
                "description": info["description"],
                "has_dataset": has_dataset,
                "exchange": "NASDAQ" if symbol in ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA", "NFLX"] else "NYSE",
                "currency": "USD"
            })
        
        return stocks
    
    def get_stock_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get stock information for a specific symbol"""
        symbol = symbol.upper()
        if symbol not in self.AVAILABLE_STOCKS:
            return None
            
        info = self.AVAILABLE_STOCKS[symbol].copy()
        csv_file = self.datasets_dir / f"{symbol}.csv"
        
        # Add current price from latest data if available
        current_price = None
        market_cap = None
        
        if csv_file.exists():
            try:
                df = self._load_csv_data(symbol)
                if not df.empty:
                    latest_row = df.iloc[-1]
                    current_price = float(latest_row['close'])
                    # Estimate market cap (this would normally come from API)
                    market_cap = self._estimate_market_cap(symbol, current_price)
            except Exception as e:
                logger.error(f"Error loading current price for {symbol}: {e}")
        
        return {
            "symbol": symbol,
            "longName": info["name"],
            "shortName": info["name"].split()[0],  # First word as short name
            "sector": info["sector"],
            "industry": info["industry"],
            "description": info["description"],
            "currentPrice": current_price,
            "regularMarketPrice": current_price,
            "marketCap": market_cap,
            "currency": "USD",
            "exchange": "NASDAQ" if symbol in ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA", "NFLX"] else "NYSE",
            "has_dataset": csv_file.exists()
        }
    
    def _estimate_market_cap(self, symbol: str, price: float) -> Optional[float]:
        """Estimate market cap based on known approximate values"""
        # These are approximate values for estimation (in billions)
        market_caps = {
            "AAPL": 3000, "MSFT": 2800, "GOOGL": 1700, "AMZN": 1500,
            "NVDA": 1200, "META": 800, "TSLA": 700, "TSMC": 500,
            "NFLX": 200, "SPY": 400
        }
        
        base_cap = market_caps.get(symbol, 100)  # Default to 100B
        # Add some variation based on current price
        variation = (price % 10) / 10 * 0.1  # Up to 10% variation
        return int(base_cap * 1e9 * (1 + variation))
    
    def load_historical_data(
        self, 
        symbol: str, 
        period: str = "1y",
        interval: str = "1d"
    ) -> List[Dict[str, Any]]:
        """
        Load historical data from CSV file or generate if not available
        
        Args:
            symbol: Stock symbol
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1d only for now)
            
        Returns:
            List of historical data points
        """
        symbol = symbol.upper()
        
        # Check if symbol is available
        if symbol not in self.AVAILABLE_STOCKS:
            logger.warning(f"Symbol {symbol} not in available stocks")
            return self._generate_fallback_data(symbol, period)
        
        # Try to load from CSV file first
        csv_file = self.datasets_dir / f"{symbol}.csv"
        if csv_file.exists():
            try:
                df = self._load_csv_data(symbol)
                if not df.empty:
                    return self._filter_by_period(df, period)
            except Exception as e:
                logger.error(f"Error loading CSV data for {symbol}: {e}")
        
        # Generate fallback data if CSV doesn't exist or failed to load
        logger.info(f"Using fallback data generation for {symbol}")
        return self._generate_fallback_data(symbol, period)
    
    def _load_csv_data(self, symbol: str) -> pd.DataFrame:
        """Load and validate CSV data"""
        csv_file = self.datasets_dir / f"{symbol}.csv"
        
        # Use cache if available
        cache_key = f"{symbol}_{csv_file.stat().st_mtime}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        # Load CSV file
        df = pd.read_csv(csv_file)
        
        # Validate required columns
        required_columns = ['date', 'open', 'high', 'low', 'close', 'volume']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Convert date column
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Remove any invalid data
        df = df.dropna(subset=['close'])
        df = df[df['close'] > 0]
        
        # Cache the result
        self._cache[cache_key] = df
        
        return df
    
    def _filter_by_period(self, df: pd.DataFrame, period: str) -> List[Dict[str, Any]]:
        """Filter dataframe by time period"""
        end_date = df['date'].max()
        
        # Calculate start date based on period
        if period == "1d":
            start_date = end_date - timedelta(days=1)
        elif period == "5d":
            start_date = end_date - timedelta(days=5)
        elif period == "1mo":
            start_date = end_date - timedelta(days=30)
        elif period == "3mo":
            start_date = end_date - timedelta(days=90)
        elif period == "6mo":
            start_date = end_date - timedelta(days=180)
        elif period == "1y":
            start_date = end_date - timedelta(days=365)
        elif period == "2y":
            start_date = end_date - timedelta(days=730)
        elif period == "5y":
            start_date = end_date - timedelta(days=1825)
        elif period == "10y":
            start_date = end_date - timedelta(days=3650)
        elif period in ["ytd", "max"]:
            start_date = df['date'].min()
        else:
            # Default to 1 year
            start_date = end_date - timedelta(days=365)
        
        # Filter data
        filtered_df = df[df['date'] >= start_date]
        
        # Convert to list of dictionaries
        data = []
        for _, row in filtered_df.iterrows():
            data.append({
                "date": row['date'].strftime("%Y-%m-%d %H:%M:%S"),
                "open": float(row['open']) if pd.notna(row['open']) else None,
                "high": float(row['high']) if pd.notna(row['high']) else None,
                "low": float(row['low']) if pd.notna(row['low']) else None,
                "close": float(row['close']) if pd.notna(row['close']) else None,
                "volume": int(row['volume']) if pd.notna(row['volume']) else None,
            })
        
        return data
    
    def _generate_fallback_data(self, symbol: str, period: str) -> List[Dict[str, Any]]:
        """Generate realistic fallback data when CSV is not available"""
        # Determine number of days based on period
        days_map = {
            "1d": 1, "5d": 5, "1mo": 30, "3mo": 90,
            "6mo": 180, "1y": 365, "2y": 730, 
            "5y": 1825, "10y": 3650, "ytd": 365, "max": 1825
        }
        
        days = days_map.get(period, 365)
        
        # Base prices for different stocks (approximate realistic ranges)
        base_prices = {
            "AAPL": 180, "GOOGL": 140, "MSFT": 350, "TSLA": 250,
            "AMZN": 140, "META": 320, "NVDA": 450, "NFLX": 400,
            "TSMC": 100, "SPY": 450
        }
        
        base_price = base_prices.get(symbol, 100)
        
        # Generate data
        data = []
        current_price = base_price
        
        for i in range(days):
            date = datetime.now() - timedelta(days=days-1-i)
            
            # Simulate realistic price movement
            daily_change = np.random.normal(0, 0.02)  # 2% daily volatility
            current_price *= (1 + daily_change)
            
            # Ensure price stays positive
            current_price = max(current_price, base_price * 0.1)
            
            # Generate OHLC data
            high = current_price * (1 + abs(np.random.normal(0, 0.01)))
            low = current_price * (1 - abs(np.random.normal(0, 0.01)))
            open_price = low + (high - low) * np.random.random()
            
            # Generate volume
            base_volume = 50000000 if symbol in ["AAPL", "MSFT", "GOOGL"] else 20000000
            volume = int(base_volume * (1 + np.random.normal(0, 0.3)))
            volume = max(volume, base_volume // 10)  # Ensure minimum volume
            
            data.append({
                "date": date.strftime("%Y-%m-%d %H:%M:%S"),
                "open": round(open_price, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(current_price, 2),
                "volume": volume,
            })
        
        logger.info(f"Generated {len(data)} fallback data points for {symbol}")
        return data
    
    def search_stocks(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search through available stocks"""
        query = query.upper().strip()
        results = []
        
        for stock in self.get_available_stocks():
            # Match by symbol or name
            if (query in stock["symbol"] or 
                query in stock["name"].upper() or
                stock["symbol"] == query):
                
                results.append({
                    "symbol": stock["symbol"],
                    "name": stock["name"],
                    "sector": stock["sector"],
                    "exchange": stock["exchange"],
                    "currency": stock["currency"],
                    "has_dataset": stock["has_dataset"]
                })
                
                if len(results) >= limit:
                    break
        
        # If no matches, return all available stocks (up to limit)
        if not results:
            all_stocks = self.get_available_stocks()[:limit]
            for stock in all_stocks:
                results.append({
                    "symbol": stock["symbol"],
                    "name": stock["name"],
                    "sector": stock["sector"],
                    "exchange": stock["exchange"],
                    "currency": stock["currency"],
                    "has_dataset": stock["has_dataset"]
                })
        
        return results
    
    def create_sample_dataset(self, symbol: str, days: int = 1095) -> bool:
        """Create a sample CSV dataset for a stock (3 years of data by default)"""
        try:
            symbol = symbol.upper()
            if symbol not in self.AVAILABLE_STOCKS:
                return False
            
            # Generate realistic historical data
            data = self._generate_fallback_data(symbol, "5y")  # 5 years
            
            # Convert to DataFrame
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
            
            # Save to CSV
            csv_file = self.datasets_dir / f"{symbol}.csv"
            df.to_csv(csv_file, index=False)
            
            logger.info(f"Created sample dataset for {symbol} with {len(data)} data points")
            return True
            
        except Exception as e:
            logger.error(f"Error creating sample dataset for {symbol}: {e}")
            return False
    
    def initialize_all_datasets(self) -> Dict[str, bool]:
        """Initialize CSV datasets for all available stocks"""
        results = {}
        
        for symbol in self.AVAILABLE_STOCKS.keys():
            csv_file = self.datasets_dir / f"{symbol}.csv"
            if not csv_file.exists():
                logger.info(f"Creating sample dataset for {symbol}")
                results[symbol] = self.create_sample_dataset(symbol)
            else:
                logger.info(f"Dataset already exists for {symbol}")
                results[symbol] = True
        
        return results