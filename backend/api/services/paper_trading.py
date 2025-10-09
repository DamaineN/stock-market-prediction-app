"""
Paper Trading Service - Virtual portfolio management for practice trading
Allows users to simulate stock trades without real money
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import numpy as np

from api.collectors.yahoo_finance import YahooFinanceCollector
from api.database.mongodb import get_database
from api.database.mongodb_models import (
    PaperTradingPortfolio, PaperTradingHolding, TradeHistory, 
    TradeType, UserActivity, PyObjectId
)

logger = logging.getLogger(__name__)

class PaperTradingService:
    """Service for managing paper trading portfolios and virtual trades"""
    
    def __init__(self):
        self.data_collector = YahooFinanceCollector()
        self.db = None
        
        # Trading constraints
        self.MAX_POSITION_SIZE = 0.25  # 25% of portfolio per stock
        self.MIN_TRADE_AMOUNT = 10.0   # Minimum $10 per trade
        self.TRANSACTION_FEE = 0.0     # No fees for paper trading
        self.STARTING_CASH = 10000.0   # Starting with $10,000
    
    async def _get_db(self):
        """Get database connection"""
        if self.db is None:
            self.db = await get_database()
        return self.db
    
    async def create_portfolio(self, user_id: str) -> Dict[str, Any]:
        """Create a new paper trading portfolio for a user"""
        try:
            db = await self._get_db()
            user_object_id = PyObjectId(user_id)
            
            # Check if user already has a portfolio
            existing_portfolio = await db.paper_trading_portfolios.find_one({
                "user_id": user_object_id
            })
            
            if existing_portfolio:
                return {
                    "success": False,
                    "message": "User already has a paper trading portfolio",
                    "portfolio_id": str(existing_portfolio["_id"])
                }
            
            # Create new portfolio
            portfolio = PaperTradingPortfolio(
                user_id=user_object_id,
                total_value=self.STARTING_CASH,
                available_cash=self.STARTING_CASH
            )
            
            result = await db.paper_trading_portfolios.insert_one(portfolio.dict(by_alias=True))
            
            # Log activity
            await self._log_activity(
                user_id=user_object_id,
                activity_type="portfolio_created",
                description="Created paper trading portfolio",
                xp_earned=50
            )
            
            return {
                "success": True,
                "message": "Paper trading portfolio created successfully",
                "portfolio_id": str(result.inserted_id),
                "starting_cash": self.STARTING_CASH
            }
            
        except Exception as e:
            logger.error(f"Error creating portfolio for user {user_id}: {str(e)}")
            return {
                "success": False,
                "message": f"Error creating portfolio: {str(e)}"
            }
    
    async def get_portfolio(self, user_id: str) -> Dict[str, Any]:
        """Get user's paper trading portfolio with current values"""
        try:
            db = await self._get_db()
            user_object_id = PyObjectId(user_id)
            
            # Get portfolio
            portfolio = await db.paper_trading_portfolios.find_one({
                "user_id": user_object_id
            })
            
            if not portfolio:
                return {
                    "success": False,
                    "message": "No portfolio found for user"
                }
            
            # Get holdings
            holdings_cursor = db.paper_trading_holdings.find({
                "user_id": user_object_id,
                "portfolio_id": portfolio["_id"]
            })
            holdings = await holdings_cursor.to_list(length=None)
            
            # Update current prices and calculate values
            updated_holdings = []
            total_invested = 0
            current_portfolio_value = portfolio["available_cash"]
            
            for holding in holdings:
                # Get current price
                current_price = await self._get_current_price(holding["symbol"])
                
                if current_price:
                    holding["current_price"] = current_price
                    holding["current_value"] = holding["quantity"] * current_price
                    holding["unrealized_pnl"] = holding["current_value"] - holding["total_invested"]
                    holding["unrealized_pnl_percent"] = (
                        (holding["unrealized_pnl"] / holding["total_invested"]) * 100 
                        if holding["total_invested"] > 0 else 0
                    )
                    
                    total_invested += holding["total_invested"]
                    current_portfolio_value += holding["current_value"]
                    
                    # Update holding in database
                    await db.paper_trading_holdings.update_one(
                        {"_id": holding["_id"]},
                        {
                            "$set": {
                                "current_price": current_price,
                                "current_value": holding["current_value"],
                                "unrealized_pnl": holding["unrealized_pnl"],
                                "unrealized_pnl_percent": holding["unrealized_pnl_percent"],
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                
                updated_holdings.append(holding)
            
            # Update portfolio values
            total_return = current_portfolio_value - self.STARTING_CASH
            total_return_percent = (total_return / self.STARTING_CASH) * 100
            
            portfolio_update = {
                "total_value": current_portfolio_value,
                "invested_amount": total_invested,
                "unrealized_pnl": current_portfolio_value - self.STARTING_CASH - portfolio["realized_pnl"],
                "total_return_percent": total_return_percent,
                "updated_at": datetime.utcnow()
            }
            
            await db.paper_trading_portfolios.update_one(
                {"_id": portfolio["_id"]},
                {"$set": portfolio_update}
            )
            
            # Update portfolio object
            portfolio.update(portfolio_update)
            
            return {
                "success": True,
                "portfolio": {
                    "id": str(portfolio["_id"]),
                    "user_id": str(portfolio["user_id"]),
                    "total_value": round(current_portfolio_value, 2),
                    "available_cash": round(portfolio["available_cash"], 2),
                    "invested_amount": round(total_invested, 2),
                    "unrealized_pnl": round(portfolio["unrealized_pnl"], 2),
                    "realized_pnl": round(portfolio["realized_pnl"], 2),
                    "total_return_percent": round(total_return_percent, 2),
                    "total_trades": portfolio["total_trades"],
                    "winning_trades": portfolio["winning_trades"],
                    "losing_trades": portfolio["losing_trades"],
                    "win_rate": (
                        (portfolio["winning_trades"] / portfolio["total_trades"]) * 100 
                        if portfolio["total_trades"] > 0 else 0
                    )
                },
                "holdings": updated_holdings
            }
            
        except Exception as e:
            logger.error(f"Error getting portfolio for user {user_id}: {str(e)}")
            return {
                "success": False,
                "message": f"Error getting portfolio: {str(e)}"
            }
    
    async def execute_trade(self, user_id: str, symbol: str, trade_type: str, 
                          quantity: int, trade_reason: Optional[str] = None) -> Dict[str, Any]:
        """Execute a paper trade (buy or sell)"""
        try:
            db = await self._get_db()
            user_object_id = PyObjectId(user_id)
            symbol = symbol.upper()
            
            # Get current price
            current_price = await self._get_current_price(symbol)
            if not current_price:
                return {
                    "success": False,
                    "message": f"Unable to get current price for {symbol}"
                }
            
            # Get portfolio
            portfolio = await db.paper_trading_portfolios.find_one({
                "user_id": user_object_id
            })
            
            if not portfolio:
                return {
                    "success": False,
                    "message": "No portfolio found. Create a portfolio first."
                }
            
            trade_amount = current_price * quantity
            
            if trade_type.lower() == "buy":
                return await self._execute_buy_order(
                    db, user_object_id, portfolio, symbol, quantity, 
                    current_price, trade_amount, trade_reason
                )
            elif trade_type.lower() == "sell":
                return await self._execute_sell_order(
                    db, user_object_id, portfolio, symbol, quantity, 
                    current_price, trade_amount, trade_reason
                )
            else:
                return {
                    "success": False,
                    "message": "Invalid trade type. Use 'buy' or 'sell'"
                }
                
        except Exception as e:
            logger.error(f"Error executing trade for user {user_id}: {str(e)}")
            return {
                "success": False,
                "message": f"Error executing trade: {str(e)}"
            }
    
    async def _execute_buy_order(self, db, user_id: PyObjectId, portfolio: Dict, 
                               symbol: str, quantity: int, current_price: float, 
                               trade_amount: float, trade_reason: Optional[str]) -> Dict[str, Any]:
        """Execute a buy order"""
        try:
            # Check if user has enough cash
            if trade_amount > portfolio["available_cash"]:
                return {
                    "success": False,
                    "message": f"Insufficient funds. Need ${trade_amount:.2f}, have ${portfolio['available_cash']:.2f}"
                }
            
            # Check minimum trade amount
            if trade_amount < self.MIN_TRADE_AMOUNT:
                return {
                    "success": False,
                    "message": f"Trade amount too small. Minimum is ${self.MIN_TRADE_AMOUNT}"
                }
            
            # Check position size limit
            max_position_value = portfolio["total_value"] * self.MAX_POSITION_SIZE
            if trade_amount > max_position_value:
                return {
                    "success": False,
                    "message": f"Position size too large. Maximum is ${max_position_value:.2f} ({self.MAX_POSITION_SIZE*100}% of portfolio)"
                }
            
            # Check if holding already exists
            existing_holding = await db.paper_trading_holdings.find_one({
                "user_id": user_id,
                "portfolio_id": portfolio["_id"],
                "symbol": symbol
            })
            
            if existing_holding:
                # Update existing holding
                new_quantity = existing_holding["quantity"] + quantity
                new_total_invested = existing_holding["total_invested"] + trade_amount
                new_average_price = new_total_invested / new_quantity
                
                await db.paper_trading_holdings.update_one(
                    {"_id": existing_holding["_id"]},
                    {
                        "$set": {
                            "quantity": new_quantity,
                            "average_buy_price": new_average_price,
                            "total_invested": new_total_invested,
                            "current_price": current_price,
                            "current_value": current_price * new_quantity,
                            "last_trade_date": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            else:
                # Create new holding
                # Get company name
                company_name = await self._get_company_name(symbol)
                
                holding = PaperTradingHolding(
                    user_id=user_id,
                    portfolio_id=portfolio["_id"],
                    symbol=symbol,
                    company_name=company_name,
                    quantity=quantity,
                    average_buy_price=current_price,
                    current_price=current_price,
                    total_invested=trade_amount,
                    current_value=trade_amount
                )
                
                await db.paper_trading_holdings.insert_one(holding.dict(by_alias=True))
            
            # Update portfolio
            new_cash = portfolio["available_cash"] - trade_amount
            new_invested = portfolio["invested_amount"] + trade_amount
            
            await db.paper_trading_portfolios.update_one(
                {"_id": portfolio["_id"]},
                {
                    "$set": {
                        "available_cash": new_cash,
                        "invested_amount": new_invested,
                        "total_trades": portfolio["total_trades"] + 1,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Record trade history
            trade_history = TradeHistory(
                user_id=user_id,
                portfolio_id=portfolio["_id"],
                symbol=symbol,
                trade_type=TradeType.BUY,
                quantity=quantity,
                price=current_price,
                total_amount=trade_amount,
                execution_price=current_price,
                trade_reason=trade_reason
            )
            
            await db.trade_history.insert_one(trade_history.dict(by_alias=True))
            
            # Log activity
            await self._log_activity(
                user_id=user_id,
                activity_type="trade",
                description=f"Bought {quantity} shares of {symbol}",
                related_symbol=symbol,
                related_amount=trade_amount,
                xp_earned=10
            )
            
            return {
                "success": True,
                "message": f"Successfully bought {quantity} shares of {symbol}",
                "trade_details": {
                    "symbol": symbol,
                    "type": "buy",
                    "quantity": quantity,
                    "price": current_price,
                    "total_amount": trade_amount,
                    "remaining_cash": new_cash,
                    "trade_time": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error executing buy order: {str(e)}")
            return {
                "success": False,
                "message": f"Error executing buy order: {str(e)}"
            }
    
    async def _execute_sell_order(self, db, user_id: PyObjectId, portfolio: Dict, 
                                symbol: str, quantity: int, current_price: float, 
                                trade_amount: float, trade_reason: Optional[str]) -> Dict[str, Any]:
        """Execute a sell order"""
        try:
            # Check if user has the holding
            holding = await db.paper_trading_holdings.find_one({
                "user_id": user_id,
                "portfolio_id": portfolio["_id"],
                "symbol": symbol
            })
            
            if not holding:
                return {
                    "success": False,
                    "message": f"No holding found for {symbol}"
                }
            
            # Check if user has enough shares
            if quantity > holding["quantity"]:
                return {
                    "success": False,
                    "message": f"Insufficient shares. Have {holding['quantity']}, trying to sell {quantity}"
                }
            
            # Calculate profit/loss
            cost_basis = holding["average_buy_price"] * quantity
            profit_loss = trade_amount - cost_basis
            profit_loss_percent = (profit_loss / cost_basis) * 100 if cost_basis > 0 else 0
            
            # Calculate holding period
            holding_period = (datetime.utcnow() - holding["first_purchase_date"]).days
            
            # Update or remove holding
            if quantity == holding["quantity"]:
                # Selling all shares - remove holding
                await db.paper_trading_holdings.delete_one({"_id": holding["_id"]})
            else:
                # Partial sale - update holding
                new_quantity = holding["quantity"] - quantity
                new_total_invested = holding["total_invested"] - cost_basis
                
                await db.paper_trading_holdings.update_one(
                    {"_id": holding["_id"]},
                    {
                        "$set": {
                            "quantity": new_quantity,
                            "total_invested": new_total_invested,
                            "current_price": current_price,
                            "current_value": current_price * new_quantity,
                            "last_trade_date": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            
            # Update portfolio
            new_cash = portfolio["available_cash"] + trade_amount
            new_invested = portfolio["invested_amount"] - cost_basis
            new_realized_pnl = portfolio["realized_pnl"] + profit_loss
            
            # Update trade statistics
            winning_trades = portfolio["winning_trades"]
            losing_trades = portfolio["losing_trades"]
            
            if profit_loss > 0:
                winning_trades += 1
            elif profit_loss < 0:
                losing_trades += 1
            
            await db.paper_trading_portfolios.update_one(
                {"_id": portfolio["_id"]},
                {
                    "$set": {
                        "available_cash": new_cash,
                        "invested_amount": new_invested,
                        "realized_pnl": new_realized_pnl,
                        "total_trades": portfolio["total_trades"] + 1,
                        "winning_trades": winning_trades,
                        "losing_trades": losing_trades,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Record trade history
            trade_history = TradeHistory(
                user_id=user_id,
                portfolio_id=portfolio["_id"],
                symbol=symbol,
                trade_type=TradeType.SELL,
                quantity=quantity,
                price=current_price,
                total_amount=trade_amount,
                execution_price=current_price,
                profit_loss=profit_loss,
                profit_loss_percent=profit_loss_percent,
                holding_period_days=holding_period,
                trade_reason=trade_reason
            )
            
            await db.trade_history.insert_one(trade_history.dict(by_alias=True))
            
            # Log activity with appropriate XP
            xp_earned = 10
            if profit_loss > 0:
                xp_earned = 25  # Bonus XP for profitable trades
                
            await self._log_activity(
                user_id=user_id,
                activity_type="trade",
                description=f"Sold {quantity} shares of {symbol} for ${profit_loss:+.2f} P&L",
                related_symbol=symbol,
                related_amount=trade_amount,
                xp_earned=xp_earned
            )
            
            return {
                "success": True,
                "message": f"Successfully sold {quantity} shares of {symbol}",
                "trade_details": {
                    "symbol": symbol,
                    "type": "sell",
                    "quantity": quantity,
                    "price": current_price,
                    "total_amount": trade_amount,
                    "profit_loss": profit_loss,
                    "profit_loss_percent": profit_loss_percent,
                    "holding_period_days": holding_period,
                    "remaining_cash": new_cash,
                    "trade_time": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error executing sell order: {str(e)}")
            return {
                "success": False,
                "message": f"Error executing sell order: {str(e)}"
            }
    
    async def get_trade_history(self, user_id: str, limit: int = 50) -> Dict[str, Any]:
        """Get user's trading history"""
        try:
            db = await self._get_db()
            user_object_id = PyObjectId(user_id)
            
            # Get portfolio
            portfolio = await db.paper_trading_portfolios.find_one({
                "user_id": user_object_id
            })
            
            if not portfolio:
                return {
                    "success": False,
                    "message": "No portfolio found for user"
                }
            
            # Get trade history
            trades_cursor = db.trade_history.find({
                "user_id": user_object_id,
                "portfolio_id": portfolio["_id"]
            }).sort("created_at", -1).limit(limit)
            
            trades = await trades_cursor.to_list(length=None)
            
            # Calculate summary statistics
            total_trades = len(trades)
            buy_trades = [t for t in trades if t["trade_type"] == TradeType.BUY]
            sell_trades = [t for t in trades if t["trade_type"] == TradeType.SELL]
            
            total_bought = sum(t["total_amount"] for t in buy_trades)
            total_sold = sum(t["total_amount"] for t in sell_trades)
            
            profitable_trades = [t for t in sell_trades if t.get("profit_loss", 0) > 0]
            losing_trades = [t for t in sell_trades if t.get("profit_loss", 0) < 0]
            
            total_profit = sum(t.get("profit_loss", 0) for t in profitable_trades)
            total_loss = sum(t.get("profit_loss", 0) for t in losing_trades)
            
            return {
                "success": True,
                "trade_history": trades,
                "summary": {
                    "total_trades": total_trades,
                    "buy_trades": len(buy_trades),
                    "sell_trades": len(sell_trades),
                    "total_bought": round(total_bought, 2),
                    "total_sold": round(total_sold, 2),
                    "profitable_trades": len(profitable_trades),
                    "losing_trades": len(losing_trades),
                    "total_profit": round(total_profit, 2),
                    "total_loss": round(total_loss, 2),
                    "net_profit_loss": round(total_profit + total_loss, 2),
                    "win_rate": (
                        (len(profitable_trades) / len(sell_trades)) * 100 
                        if len(sell_trades) > 0 else 0
                    )
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting trade history for user {user_id}: {str(e)}")
            return {
                "success": False,
                "message": f"Error getting trade history: {str(e)}"
            }
    
    async def get_portfolio_performance(self, user_id: str) -> Dict[str, Any]:
        """Get detailed portfolio performance analytics"""
        try:
            db = await self._get_db()
            user_object_id = PyObjectId(user_id)
            
            # Get portfolio with current values
            portfolio_data = await self.get_portfolio(user_id)
            if not portfolio_data["success"]:
                return portfolio_data
            
            portfolio = portfolio_data["portfolio"]
            
            # Get trade history for analytics
            trade_history_data = await self.get_trade_history(user_id, limit=1000)
            if not trade_history_data["success"]:
                return trade_history_data
            
            trades = trade_history_data["trade_history"]
            
            # Calculate performance metrics
            total_return = portfolio["total_value"] - self.STARTING_CASH
            total_return_percent = (total_return / self.STARTING_CASH) * 100
            
            # Calculate daily returns (simplified)
            portfolio_age_days = max((datetime.utcnow() - datetime.fromisoformat(portfolio.get("created_at", datetime.utcnow().isoformat()))).days, 1)
            daily_return = (total_return / portfolio_age_days) if portfolio_age_days > 0 else 0
            
            # Best and worst performing stocks
            holdings = portfolio_data.get("holdings", [])
            best_stock = None
            worst_stock = None
            
            if holdings:
                best_stock = max(holdings, key=lambda x: x.get("unrealized_pnl_percent", 0))
                worst_stock = min(holdings, key=lambda x: x.get("unrealized_pnl_percent", 0))
            
            # Trading frequency
            trades_per_week = (len(trades) / (portfolio_age_days / 7)) if portfolio_age_days > 0 else 0
            
            return {
                "success": True,
                "performance": {
                    "portfolio_value": portfolio["total_value"],
                    "total_return": round(total_return, 2),
                    "total_return_percent": round(total_return_percent, 2),
                    "daily_return": round(daily_return, 2),
                    "unrealized_pnl": portfolio["unrealized_pnl"],
                    "realized_pnl": portfolio["realized_pnl"],
                    "win_rate": portfolio["win_rate"],
                    "total_trades": portfolio["total_trades"],
                    "portfolio_age_days": portfolio_age_days,
                    "trades_per_week": round(trades_per_week, 1),
                    "best_performing_stock": {
                        "symbol": best_stock["symbol"] if best_stock else None,
                        "return_percent": best_stock.get("unrealized_pnl_percent", 0) if best_stock else 0
                    },
                    "worst_performing_stock": {
                        "symbol": worst_stock["symbol"] if worst_stock else None,
                        "return_percent": worst_stock.get("unrealized_pnl_percent", 0) if worst_stock else 0
                    },
                    "diversification": {
                        "number_of_positions": len(holdings),
                        "largest_position_percent": (
                            max((h["current_value"] / portfolio["total_value"]) * 100 for h in holdings) 
                            if holdings else 0
                        )
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting portfolio performance for user {user_id}: {str(e)}")
            return {
                "success": False,
                "message": f"Error getting portfolio performance: {str(e)}"
            }
    
    async def _get_current_price(self, symbol: str) -> Optional[float]:
        """Get current stock price"""
        try:
            # For paper trading, we'll use the most recent price from historical data
            historical_data = await self.data_collector.get_historical_data(
                symbol=symbol,
                period="1d",
                interval="1m"
            )
            
            if historical_data and len(historical_data) > 0:
                return historical_data[-1]["close"]
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting current price for {symbol}: {str(e)}")
            return None
    
    async def _get_company_name(self, symbol: str) -> str:
        """Get company name for symbol"""
        try:
            # For now, return the symbol
            # In a real implementation, you'd fetch this from a stock info API
            return symbol
        except:
            return symbol
    
    async def _log_activity(self, user_id: PyObjectId, activity_type: str, 
                          description: str, related_symbol: Optional[str] = None,
                          related_amount: Optional[float] = None, xp_earned: int = 0):
        """Log user activity"""
        try:
            db = await self._get_db()
            
            activity = UserActivity(
                user_id=user_id,
                activity_type=activity_type,
                activity_description=description,
                related_symbol=related_symbol,
                related_amount=related_amount,
                xp_earned=xp_earned
            )
            
            await db.user_activities.insert_one(activity.dict(by_alias=True))
            
        except Exception as e:
            logger.error(f"Error logging activity: {str(e)}")

    async def reset_portfolio(self, user_id: str) -> Dict[str, Any]:
        """Reset user's paper trading portfolio (for learning purposes)"""
        try:
            db = await self._get_db()
            user_object_id = PyObjectId(user_id)
            
            # Delete all holdings
            await db.paper_trading_holdings.delete_many({
                "user_id": user_object_id
            })
            
            # Reset portfolio to starting values
            await db.paper_trading_portfolios.update_one(
                {"user_id": user_object_id},
                {
                    "$set": {
                        "total_value": self.STARTING_CASH,
                        "available_cash": self.STARTING_CASH,
                        "invested_amount": 0.0,
                        "unrealized_pnl": 0.0,
                        "realized_pnl": 0.0,
                        "total_return_percent": 0.0,
                        "total_trades": 0,
                        "winning_trades": 0,
                        "losing_trades": 0,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Log activity
            await self._log_activity(
                user_id=user_object_id,
                activity_type="portfolio_reset",
                description="Reset paper trading portfolio",
                xp_earned=0
            )
            
            return {
                "success": True,
                "message": "Portfolio reset successfully",
                "starting_cash": self.STARTING_CASH
            }
            
        except Exception as e:
            logger.error(f"Error resetting portfolio for user {user_id}: {str(e)}")
            return {
                "success": False,
                "message": f"Error resetting portfolio: {str(e)}"
            }