"""
Yahoo Finance data collector
"""
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging

logger = logging.getLogger(__name__)

class YahooFinanceCollector:
    """Yahoo Finance data collector using yfinance library"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    async def get_historical_data(
        self, 
        symbol: str, 
        period: str = "1y", 
        interval: str = "1d"
    ) -> List[Dict[str, Any]]:
        """
        Get historical stock data
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL', 'GOOGL')
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
        
        Returns:
            List of historical data points
        """
        try:
            loop = asyncio.get_event_loop()
            data = await loop.run_in_executor(
                self.executor, 
                self._fetch_historical_data, 
                symbol, period, interval
            )
            return data
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {str(e)}")
            return []
    
    def _fetch_historical_data(self, symbol: str, period: str, interval: str) -> List[Dict[str, Any]]:
        """Internal method to fetch historical data"""
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)
        
        if hist.empty:
            return []
        
        # Convert to list of dictionaries
        data = []
        for date, row in hist.iterrows():
            data.append({
                "date": date.strftime("%Y-%m-%d %H:%M:%S") if hasattr(date, 'strftime') else str(date),
                "open": float(row['Open']) if pd.notna(row['Open']) else None,
                "high": float(row['High']) if pd.notna(row['High']) else None,
                "low": float(row['Low']) if pd.notna(row['Low']) else None,
                "close": float(row['Close']) if pd.notna(row['Close']) else None,
                "volume": int(row['Volume']) if pd.notna(row['Volume']) else None,
            })
        
        return data
    
    async def get_stock_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get basic stock information
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Stock information dictionary
        """
        try:
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(
                self.executor, 
                self._fetch_stock_info, 
                symbol
            )
            return info
        except Exception as e:
            logger.error(f"Error fetching stock info for {symbol}: {str(e)}")
            return None
    
    def _fetch_stock_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Internal method to fetch stock information"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                return None
            
            # Extract relevant information
            return {
                "symbol": symbol.upper(),
                "longName": info.get("longName"),
                "shortName": info.get("shortName"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "marketCap": info.get("marketCap"),
                "currentPrice": info.get("currentPrice"),
                "regularMarketPrice": info.get("regularMarketPrice"),
                "previousClose": info.get("previousClose"),
                "dayLow": info.get("dayLow"),
                "dayHigh": info.get("dayHigh"),
                "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
                "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
                "volume": info.get("volume"),
                "averageVolume": info.get("averageVolume"),
                "beta": info.get("beta"),
                "dividendYield": info.get("dividendYield"),
                "peRatio": info.get("trailingPE"),
                "eps": info.get("trailingEps"),
                "currency": info.get("currency", "USD"),
                "exchange": info.get("exchange"),
                "description": info.get("longBusinessSummary", "")[:500] if info.get("longBusinessSummary") else None
            }
        except Exception as e:
            logger.error(f"Error in _fetch_stock_info for {symbol}: {str(e)}")
            return None
    
    async def search_stocks(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for stocks by symbol or company name
        Note: This is a simplified search using common symbols
        
        Args:
            query: Search query
            limit: Maximum number of results
            
        Returns:
            List of search results
        """
        try:
            # For simplicity, we'll try to get info for the query as a symbol
            # In a real implementation, you'd use a proper search API
            query = query.upper().strip()
            
            # Common symbols to try variations
            symbols_to_try = [query]
            if len(query) <= 4:
                # Try common variations for short queries
                symbols_to_try.extend([f"{query}.TO", f"{query}.L"])
            
            results = []
            for symbol in symbols_to_try[:limit]:
                info = await self.get_stock_info(symbol)
                if info:
                    results.append({
                        "symbol": symbol,
                        "name": info.get("longName") or info.get("shortName"),
                        "sector": info.get("sector"),
                        "exchange": info.get("exchange"),
                        "currency": info.get("currency")
                    })
            
            return results
        except Exception as e:
            logger.error(f"Error searching stocks for query '{query}': {str(e)}")
            return []
    
    async def get_financial_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get financial data for a stock
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Financial data dictionary
        """
        try:
            loop = asyncio.get_event_loop()
            data = await loop.run_in_executor(
                self.executor, 
                self._fetch_financial_data, 
                symbol
            )
            return data
        except Exception as e:
            logger.error(f"Error fetching financial data for {symbol}: {str(e)}")
            return None
    
    def _fetch_financial_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Internal method to fetch financial data"""
        try:
            ticker = yf.Ticker(symbol)
            
            # Get financial statements
            income_stmt = ticker.income_stmt
            balance_sheet = ticker.balance_sheet
            cash_flow = ticker.cash_flow
            
            return {
                "symbol": symbol.upper(),
                "income_statement": income_stmt.to_dict() if not income_stmt.empty else {},
                "balance_sheet": balance_sheet.to_dict() if not balance_sheet.empty else {},
                "cash_flow": cash_flow.to_dict() if not cash_flow.empty else {},
                "fetched_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in _fetch_financial_data for {symbol}: {str(e)}")
            return None
    
    def __del__(self):
        """Clean up the thread pool executor"""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)
