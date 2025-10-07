"""
Paper Trading API routes - Virtual portfolio management and trading simulation
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from api.services.paper_trading import PaperTradingService
from api.auth.utils import get_current_user
from api.database.mongodb_models import UserInDB, TradeType

router = APIRouter()

class TradeRequest(BaseModel):
    symbol: str
    trade_type: str  # "buy" or "sell"
    quantity: int
    trade_reason: Optional[str] = None

class TradeResponse(BaseModel):
    success: bool
    message: str
    trade_details: Optional[Dict[str, Any]] = None

@router.post("/paper-trading/portfolio/create")
async def create_portfolio(current_user: UserInDB = Depends(get_current_user)):
    """Create a new paper trading portfolio for the user"""
    try:
        paper_trading_service = PaperTradingService()
        
        result = await paper_trading_service.create_portfolio(str(current_user.id))
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating portfolio: {str(e)}"
        )

@router.get("/paper-trading/portfolio")
async def get_portfolio(current_user: UserInDB = Depends(get_current_user)):
    """Get user's paper trading portfolio with current values"""
    try:
        paper_trading_service = PaperTradingService()
        
        result = await paper_trading_service.get_portfolio(str(current_user.id))
        
        if not result["success"]:
            if "No portfolio found" in result["message"]:
                raise HTTPException(status_code=404, detail=result["message"])
            else:
                raise HTTPException(status_code=400, detail=result["message"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting portfolio: {str(e)}"
        )

@router.post("/paper-trading/trade", response_model=TradeResponse)
async def execute_trade(
    request: TradeRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Execute a paper trade (buy or sell)"""
    try:
        if request.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        
        if request.trade_type.lower() not in ["buy", "sell"]:
            raise HTTPException(status_code=400, detail="Trade type must be 'buy' or 'sell'")
        
        paper_trading_service = PaperTradingService()
        
        result = await paper_trading_service.execute_trade(
            user_id=str(current_user.id),
            symbol=request.symbol.upper(),
            trade_type=request.trade_type.lower(),
            quantity=request.quantity,
            trade_reason=request.trade_reason
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing trade: {str(e)}"
        )

@router.get("/paper-trading/history")
async def get_trade_history(
    limit: int = Query(default=50, ge=1, le=500, description="Number of trades to return"),
    current_user: UserInDB = Depends(get_current_user)
):
    """Get user's trading history"""
    try:
        paper_trading_service = PaperTradingService()
        
        result = await paper_trading_service.get_trade_history(
            user_id=str(current_user.id),
            limit=limit
        )
        
        if not result["success"]:
            if "No portfolio found" in result["message"]:
                raise HTTPException(status_code=404, detail=result["message"])
            else:
                raise HTTPException(status_code=400, detail=result["message"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting trade history: {str(e)}"
        )

@router.get("/paper-trading/performance")
async def get_portfolio_performance(current_user: UserInDB = Depends(get_current_user)):
    """Get detailed portfolio performance analytics"""
    try:
        paper_trading_service = PaperTradingService()
        
        result = await paper_trading_service.get_portfolio_performance(
            user_id=str(current_user.id)
        )
        
        if not result["success"]:
            if "No portfolio found" in result["message"]:
                raise HTTPException(status_code=404, detail=result["message"])
            else:
                raise HTTPException(status_code=400, detail=result["message"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting portfolio performance: {str(e)}"
        )

@router.post("/paper-trading/portfolio/reset")
async def reset_portfolio(current_user: UserInDB = Depends(get_current_user)):
    """Reset user's paper trading portfolio (for learning purposes)"""
    try:
        paper_trading_service = PaperTradingService()
        
        result = await paper_trading_service.reset_portfolio(str(current_user.id))
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error resetting portfolio: {str(e)}"
        )

@router.get("/paper-trading/quote/{symbol}")
async def get_stock_quote(symbol: str):
    """Get current stock quote for paper trading"""
    try:
        paper_trading_service = PaperTradingService()
        
        current_price = await paper_trading_service._get_current_price(symbol.upper())
        
        if not current_price:
            raise HTTPException(
                status_code=404, 
                detail=f"Unable to get quote for {symbol.upper()}"
            )
        
        return {
            "symbol": symbol.upper(),
            "current_price": current_price,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting stock quote: {str(e)}"
        )

@router.get("/paper-trading/dashboard")
async def get_trading_dashboard(current_user: UserInDB = Depends(get_current_user)):
    """Get comprehensive trading dashboard data"""
    try:
        paper_trading_service = PaperTradingService()
        
        # Get portfolio data
        portfolio_result = await paper_trading_service.get_portfolio(str(current_user.id))
        
        # Get performance data
        performance_result = await paper_trading_service.get_portfolio_performance(str(current_user.id))
        
        # Get recent trades
        history_result = await paper_trading_service.get_trade_history(str(current_user.id), limit=10)
        
        # Combine all data
        dashboard_data = {
            "user_id": str(current_user.id),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if portfolio_result["success"]:
            dashboard_data["portfolio"] = portfolio_result["portfolio"]
            dashboard_data["holdings"] = portfolio_result["holdings"]
        else:
            dashboard_data["portfolio"] = None
            dashboard_data["portfolio_error"] = portfolio_result["message"]
        
        if performance_result["success"]:
            dashboard_data["performance"] = performance_result["performance"]
        else:
            dashboard_data["performance"] = None
            dashboard_data["performance_error"] = performance_result["message"]
        
        if history_result["success"]:
            dashboard_data["recent_trades"] = history_result["trade_history"][:5]  # Last 5 trades
            dashboard_data["trade_summary"] = history_result["summary"]
        else:
            dashboard_data["recent_trades"] = []
            dashboard_data["trade_summary"] = None
        
        return {
            "success": True,
            "dashboard": dashboard_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting trading dashboard: {str(e)}"
        )

@router.get("/paper-trading/leaderboard")
async def get_leaderboard(
    limit: int = Query(default=10, ge=5, le=50, description="Number of users to return"),
    timeframe: str = Query(default="all", description="Timeframe for leaderboard (all, monthly, weekly)")
):
    """Get paper trading leaderboard (top performing users)"""
    try:
        # This is a placeholder implementation
        # In a real app, you'd query all user portfolios and rank them
        
        # For now, return mock data
        mock_leaderboard = [
            {
                "rank": 1,
                "user_name": "TradingPro",
                "total_return_percent": 25.4,
                "total_value": 12540.0,
                "win_rate": 85.2,
                "total_trades": 47
            },
            {
                "rank": 2,
                "user_name": "StockGuru",
                "total_return_percent": 18.7,
                "total_value": 11870.0,
                "win_rate": 78.9,
                "total_trades": 38
            },
            {
                "rank": 3,
                "user_name": "MarketMaster",
                "total_return_percent": 15.3,
                "total_value": 11530.0,
                "win_rate": 72.1,
                "total_trades": 43
            }
        ]
        
        return {
            "success": True,
            "leaderboard": mock_leaderboard[:limit],
            "timeframe": timeframe,
            "total_participants": 150,  # Mock data
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting leaderboard: {str(e)}"
        )