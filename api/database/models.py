"""
Database Models - All entities from ERD
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class UserTypeEnum(enum.Enum):
    BEGINNER = "beginner"
    CASUAL = "casual"
    PAPER_TRADER = "paper_trader"

class GoalTypeEnum(enum.Enum):
    PRICE_TARGET = "price_target"
    PORTFOLIO_VALUE = "portfolio_value"
    RETURNS = "returns"
    RISK_MANAGEMENT = "risk_management"
    DIVERSIFICATION = "diversification"

class RecommendationTypeEnum(enum.Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"

# User Entity
class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    user_type = Column(Enum(UserTypeEnum), nullable=False, default=UserTypeEnum.BEGINNER)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    created_date = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    simulations = relationship("Simulation", back_populates="user")
    investment_goals = relationship("InvestmentGoal", back_populates="user")

# Stock Entity
class Stock(Base):
    __tablename__ = "stocks"
    
    stock_id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), unique=True, index=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    sector = Column(String(100))
    exchange = Column(String(50))
    
    # Relationships
    historical_data = relationship("HistoricalData", back_populates="stock")
    predictions = relationship("Prediction", back_populates="stock")
    recommendations = relationship("Recommendation", back_populates="stock")
    simulations = relationship("Simulation", back_populates="stock")

# Historical Data Entity
class HistoricalData(Base):
    __tablename__ = "historical_data"
    
    data_id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.stock_id"), nullable=False)
    date = Column(DateTime, nullable=False)
    open_price = Column(Float, nullable=False)
    close_price = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    
    # Relationship
    stock = relationship("Stock", back_populates="historical_data")

# Prediction Entity
class Prediction(Base):
    __tablename__ = "predictions"
    
    prediction_id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.stock_id"), nullable=False)
    predicted_date = Column(DateTime, nullable=False)
    predicted_price = Column(Float, nullable=False)
    confidence_level = Column(Float, nullable=False)  # 0.0 to 1.0
    generated_date = Column(DateTime, default=datetime.utcnow)
    model_used = Column(String(50))  # "lstm", "arima", "ensemble"
    
    # Relationship
    stock = relationship("Stock", back_populates="predictions")

# Recommendation Entity
class Recommendation(Base):
    __tablename__ = "recommendations"
    
    recommendation_id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.stock_id"), nullable=False)
    recommendation_type = Column(Enum(RecommendationTypeEnum), nullable=False)
    recommendation_date = Column(DateTime, default=datetime.utcnow)
    reason_summary = Column(Text)
    confidence_score = Column(Float)  # AI confidence in recommendation
    target_price = Column(Float)  # For BUY recommendations
    stop_loss = Column(Float)  # Risk management
    
    # Relationship
    stock = relationship("Stock", back_populates="recommendations")

# Simulation Entity (Paper Trading)
class Simulation(Base):
    __tablename__ = "simulations"
    
    simulation_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.stock_id"), nullable=False)
    buy_price = Column(Float)
    sell_price = Column(Float)
    buy_date = Column(DateTime)
    sell_date = Column(DateTime)
    quantity = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)  # Still holding position
    profit_loss = Column(Float, default=0.0)
    
    # Relationships
    user = relationship("User", back_populates="simulations")
    stock = relationship("Stock", back_populates="simulations")

# Investment Goal Entity
class InvestmentGoal(Base):
    __tablename__ = "investment_goals"
    
    goal_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    goal_name = Column(String(255), nullable=False)
    goal_type = Column(Enum(GoalTypeEnum), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    deadline = Column(DateTime)
    created_date = Column(DateTime, default=datetime.utcnow)
    is_achieved = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Relationship
    user = relationship("User", back_populates="investment_goals")
