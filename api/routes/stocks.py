from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd

router = APIRouter()

class StockInfo(BaseModel):
    symbol: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    price: Optional[float] = None

class StockDataResponse(BaseModel):
    symbol: str
    data: List[dict]
    metadata: dict

@router.get("/stocks/{symbol}/info")
async def get_stock_info(symbol: str):
    """Get basic stock information using yfinance"""
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info
        
        if not info or 'regularMarketPrice' not in info:
            raise HTTPException(status_code=404, detail=f"Stock information not found for {symbol}")
        
        return StockInfo(
            symbol=symbol.upper(),
            name=info.get('longName', info.get('shortName', '')),
            sector=info.get('sector'),
            industry=info.get('industry'),
            market_cap=info.get('marketCap'),
            price=info.get('regularMarketPrice', info.get('currentPrice'))
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock info: {str(e)}")

@router.get("/stocks/{symbol}/historical")
async def get_historical_data(
    symbol: str,
    period: str = Query(default="1y", description="Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)"),
    interval: str = Query(default="1d", description="Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)")
):
    """Get historical stock data using yfinance"""
    try:
        ticker = yf.Ticker(symbol.upper())
        
        # Get historical data
        hist = ticker.history(period=period, interval=interval)
        
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")
        
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
        
        return StockDataResponse(
            symbol=symbol.upper(),
            data=data,
            metadata={
                "period": period,
                "interval": interval,
                "count": len(data),
                "last_updated": datetime.utcnow().isoformat(),
                "source": "Yahoo Finance"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@router.get("/stocks/search")
async def search_stocks(
    query: str = Query(description="Search query for stock symbols or company names"),
    limit: int = Query(default=10, le=50, description="Maximum number of results")
):
    """Search for stocks by symbol or company name"""
    try:
        # Simple search using common symbols
        common_symbols = [
            {"symbol": "AAPL", "name": "Apple Inc.", "type": "stock"},
            {"symbol": "GOOGL", "name": "Alphabet Inc.", "type": "stock"},
            {"symbol": "MSFT", "name": "Microsoft Corporation", "type": "stock"},
            {"symbol": "TSLA", "name": "Tesla, Inc.", "type": "stock"},
            {"symbol": "AMZN", "name": "Amazon.com, Inc.", "type": "stock"},
            {"symbol": "META", "name": "Meta Platforms, Inc.", "type": "stock"},
            {"symbol": "NFLX", "name": "Netflix, Inc.", "type": "stock"},
            {"symbol": "NVDA", "name": "NVIDIA Corporation", "type": "stock"},
            {"symbol": "AMD", "name": "Advanced Micro Devices, Inc.", "type": "stock"},
            {"symbol": "INTC", "name": "Intel Corporation", "type": "stock"}
        ]
        
        # Filter results based on query
        results = []
        query_lower = query.lower()
        
        for stock in common_symbols:
            if (query_lower in stock["symbol"].lower() or 
                query_lower in stock["name"].lower()):
                results.append(stock)
                if len(results) >= limit:
                    break
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching stocks: {str(e)}")

# Mock endpoints for compatibility with frontend
@router.get("/watchlist")
async def get_watchlist():
    """Get user's watchlist"""
    return {
        "watchlist": [
            {"symbol": "AAPL", "name": "Apple Inc.", "price": 150.00, "change": 2.5},
            {"symbol": "GOOGL", "name": "Alphabet Inc.", "price": 2800.00, "change": -15.0}
        ]
    }

@router.post("/watchlist")
async def add_to_watchlist(request: dict):
    """Add stock to watchlist"""
    return {"success": True, "message": "Stock added to watchlist"}

@router.get("/predictions")
async def get_predictions():
    """Get stock predictions"""
    return {
        "predictions": [
            {
                "symbol": "AAPL",
                "prediction": 155.0,
                "confidence": 0.75,
                "direction": "up",
                "created_at": datetime.utcnow().isoformat()
            }
        ]
    }

@router.post("/predictions")
async def create_prediction(request: dict):
    """Create a new prediction"""
    return {
        "success": True,
        "prediction": {
            "symbol": request.get("symbol", "AAPL"),
            "prediction": 155.0,
            "confidence": 0.75,
            "direction": "up",
            "created_at": datetime.utcnow().isoformat()
        }
    }