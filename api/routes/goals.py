"""
Investment Goals API routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

from api.routes.auth import get_current_user
from api.database.models import GoalTypeEnum

router = APIRouter()

# Pydantic Models
class GoalCreate(BaseModel):
    goal_name: str
    goal_type: GoalTypeEnum
    target_amount: float
    deadline: Optional[date] = None
    description: Optional[str] = None

class GoalUpdate(BaseModel):
    goal_name: Optional[str] = None
    target_amount: Optional[float] = None
    deadline: Optional[date] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class GoalResponse(BaseModel):
    goal_id: int
    goal_name: str
    goal_type: str
    target_amount: float
    current_amount: float
    progress_percent: float
    deadline: Optional[date]
    days_remaining: Optional[int]
    created_date: datetime
    is_achieved: bool
    is_active: bool
    description: Optional[str] = None

@router.get("/goals", response_model=List[GoalResponse])
async def get_user_goals(
    active_only: bool = Query(default=True),
    current_user: dict = Depends(get_current_user)
):
    """Get user's investment goals"""
    user_id = current_user["user_id"]
    
    # TODO: Fetch goals from database
    # TODO: Calculate current progress for each goal
    
    # Mock goals data
    goals = [
        GoalResponse(
            goal_id=1,
            goal_name="AAPL Price Target",
            goal_type="price_target",
            target_amount=200.0,
            current_amount=155.0,
            progress_percent=77.5,
            deadline=date(2024, 6, 30),
            days_remaining=95,
            created_date=datetime(2024, 1, 15),
            is_achieved=False,
            is_active=True,
            description="Waiting for AAPL to reach $200"
        ),
        GoalResponse(
            goal_id=2,
            goal_name="Portfolio Growth",
            goal_type="portfolio_value",
            target_amount=25000.0,
            current_amount=20425.0,
            progress_percent=81.7,
            deadline=date(2024, 12, 31),
            days_remaining=320,
            created_date=datetime(2024, 1, 1),
            is_achieved=False,
            is_active=True,
            description="Grow portfolio to $25k by end of year"
        )
    ]
    
    if active_only:
        goals = [g for g in goals if g.is_active]
    
    return goals

@router.post("/goals", response_model=GoalResponse)
async def create_goal(
    goal: GoalCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new investment goal"""
    user_id = current_user["user_id"]
    
    # TODO: Save goal to database
    # TODO: Set up goal tracking/monitoring
    
    # Calculate days remaining
    days_remaining = None
    if goal.deadline:
        days_remaining = (goal.deadline - date.today()).days
    
    # Mock goal creation
    new_goal = GoalResponse(
        goal_id=99,  # Would come from database
        goal_name=goal.goal_name,
        goal_type=goal.goal_type.value,
        target_amount=goal.target_amount,
        current_amount=0.0,  # Would calculate based on goal type
        progress_percent=0.0,
        deadline=goal.deadline,
        days_remaining=days_remaining,
        created_date=datetime.utcnow(),
        is_achieved=False,
        is_active=True,
        description=goal.description
    )
    
    return new_goal

@router.put("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing goal"""
    user_id = current_user["user_id"]
    
    # TODO: Verify goal belongs to user
    # TODO: Update goal in database
    
    # Mock goal update
    updated_goal = GoalResponse(
        goal_id=goal_id,
        goal_name=goal_update.goal_name or "Updated Goal",
        goal_type="portfolio_value",
        target_amount=goal_update.target_amount or 25000.0,
        current_amount=20425.0,
        progress_percent=81.7,
        deadline=goal_update.deadline,
        days_remaining=320 if goal_update.deadline else None,
        created_date=datetime(2024, 1, 1),
        is_achieved=False,
        is_active=goal_update.is_active if goal_update.is_active is not None else True,
        description="Updated goal description"
    )
    
    return updated_goal

@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a goal"""
    user_id = current_user["user_id"]
    
    # TODO: Verify goal belongs to user
    # TODO: Delete goal from database
    
    return {"message": f"Goal {goal_id} deleted successfully"}

@router.get("/goals/{goal_id}/progress")
async def get_goal_progress(
    goal_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed progress for a specific goal"""
    user_id = current_user["user_id"]
    
    # TODO: Calculate detailed progress based on goal type
    # TODO: Include historical progress data
    
    # Mock progress data
    return {
        "goal_id": goal_id,
        "current_value": 20425.0,
        "target_value": 25000.0,
        "progress_percent": 81.7,
        "amount_remaining": 4575.0,
        "daily_progress_needed": 14.3,  # Amount needed per day to reach goal
        "on_track": True,
        "progress_history": [
            {"date": "2024-01-01", "value": 20000.0, "progress": 80.0},
            {"date": "2024-01-15", "value": 20125.0, "progress": 80.5},
            {"date": "2024-01-30", "value": 20425.0, "progress": 81.7}
        ],
        "milestones": [
            {"percentage": 25, "achieved": True, "date": "2024-01-05"},
            {"percentage": 50, "achieved": True, "date": "2024-01-12"},
            {"percentage": 75, "achieved": True, "date": "2024-01-25"},
            {"percentage": 100, "achieved": False, "projected_date": "2024-11-15"}
        ]
    }

@router.get("/goals/suggestions")
async def get_goal_suggestions(current_user: dict = Depends(get_current_user)):
    """Get AI-powered goal suggestions based on user's portfolio"""
    user_id = current_user["user_id"]
    user_type = current_user["user_type"]
    
    # TODO: Analyze user's portfolio and trading history
    # TODO: Generate personalized goal suggestions
    
    # Mock suggestions based on user type
    suggestions = []
    
    if user_type == "beginner":
        suggestions = [
            {
                "goal_type": "portfolio_value",
                "suggested_target": 15000.0,
                "timeframe_days": 365,
                "description": "Build your first $15K portfolio",
                "reasoning": "Based on typical beginner growth patterns"
            },
            {
                "goal_type": "diversification",
                "suggested_target": 5.0,  # 5 different sectors
                "timeframe_days": 180,
                "description": "Diversify across 5 sectors",
                "reasoning": "Reduce portfolio risk through diversification"
            }
        ]
    elif user_type == "casual":
        suggestions = [
            {
                "goal_type": "returns",
                "suggested_target": 10.0,  # 10% annual return
                "timeframe_days": 365,
                "description": "Achieve 10% annual returns",
                "reasoning": "Realistic target for casual investors"
            },
            {
                "goal_type": "portfolio_value",
                "suggested_target": 50000.0,
                "timeframe_days": 730,  # 2 years
                "description": "Build $50K portfolio in 2 years",
                "reasoning": "Long-term wealth building goal"
            }
        ]
    else:  # paper_trader
        suggestions = [
            {
                "goal_type": "returns",
                "suggested_target": 15.0,  # 15% annual return
                "timeframe_days": 365,
                "description": "Beat market with 15% returns",
                "reasoning": "Aggressive growth target for active traders"
            },
            {
                "goal_type": "risk_management",
                "suggested_target": -5.0,  # Max 5% drawdown
                "timeframe_days": 30,
                "description": "Limit monthly losses to 5%",
                "reasoning": "Risk management is key for active trading"
            }
        ]
    
    return {"suggestions": suggestions}

@router.post("/goals/{goal_id}/celebrate")
async def celebrate_achievement(
    goal_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Mark goal as celebrated (when user achieves a goal)"""
    user_id = current_user["user_id"]
    
    # TODO: Mark goal as achieved and celebrated
    # TODO: Generate achievement badge/certificate
    # TODO: Send congratulations notification
    
    return {
        "message": "🎉 Congratulations on achieving your goal!",
        "achievement_badge": "Portfolio Master",
        "celebration_message": "You've successfully reached your investment target!",
        "next_steps": [
            "Set a new, more ambitious goal",
            "Share your success with the community",
            "Analyze what strategies worked best"
        ]
    }
