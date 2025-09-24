"""
Watchlist API routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timezone

from api.auth.utils import get_current_user
from api.database.mongodb import get_database, UserService
from api.database.mongodb_models import WatchlistItem, Watchlist
from api.collectors.yahoo_finance import YahooFinanceCollector

router = APIRouter()

@router.get("/watchlist")
async def get_user_watchlist(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get current user's watchlist"""
    try:
        # For now, return mock data since we don't have watchlist collection set up
        # In a real app, you'd fetch from database
        mock_watchlist = [
            {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "price": 185.50,
                "change": 2.30,
                "changePercent": 1.26,
                "addedAt": "2024-01-15T10:30:00Z"
            },
            {
                "symbol": "GOOGL", 
                "name": "Alphabet Inc.",
                "price": 2750.30,
                "change": -15.20,
                "changePercent": -0.55,
                "addedAt": "2024-01-10T14:20:00Z"
            }
        ]
        
        return {
            "items": mock_watchlist,
            "count": len(mock_watchlist),
            "lastUpdated": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching watchlist: {str(e)}"
        )

@router.post("/watchlist")
async def add_to_watchlist(
    item: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Add a stock to user's watchlist"""
    try:
        symbol = item.get("symbol", "").upper()
        name = item.get("name", "")
        
        if not symbol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock symbol is required"
            )
        
        # Get current stock price from Yahoo Finance
        collector = YahooFinanceCollector()
        try:
            stock_info = await collector.get_stock_info(symbol)
            current_price = stock_info.get('currentPrice', stock_info.get('regularMarketPrice', 0))
            company_name = stock_info.get('longName', stock_info.get('shortName', name))
        except:
            # If can't fetch real data, use provided data
            current_price = 100.0
            company_name = name or f"{symbol} Corporation"
        
        # In a real app, you'd save to database
        # For now, return the added item
        watchlist_item = {
            "symbol": symbol,
            "name": company_name,
            "price": current_price,
            "change": 0.0,
            "changePercent": 0.0,
            "addedAt": datetime.now(timezone.utc).isoformat()
        }
        
        return watchlist_item
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding to watchlist: {str(e)}"
        )

@router.delete("/watchlist/{symbol}")
async def remove_from_watchlist(
    symbol: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Remove a stock from user's watchlist"""
    try:
        # In a real app, you'd remove from database
        # For now, just return success
        return {"message": f"Removed {symbol.upper()} from watchlist"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing from watchlist: {str(e)}"
        )

@router.post("/watchlist/refresh")
async def refresh_watchlist_prices(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Refresh prices for all stocks in watchlist"""
    try:
        # In a real app, you'd update all watchlist items with current prices
        # For now, return mock refreshed data
        refreshed_items = [
            {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "price": 186.75,
                "change": 3.55,
                "changePercent": 1.94,
                "addedAt": "2024-01-15T10:30:00Z"
            }
        ]
        
        return {
            "items": refreshed_items,
            "count": len(refreshed_items),
            "lastUpdated": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing watchlist: {str(e)}"
        )

@router.get("/watchlist/stats")
async def get_watchlist_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get watchlist statistics"""
    try:
        # Mock statistics
        return {
            "totalItems": 2,
            "totalValue": 2935.80,
            "totalGain": -12.90,
            "totalGainPercent": -0.44,
            "topGainer": {
                "symbol": "AAPL",
                "changePercent": 1.26
            },
            "topLoser": {
                "symbol": "GOOGL", 
                "changePercent": -0.55
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting watchlist stats: {str(e)}"
        )