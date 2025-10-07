"""
Real-time Dashboard API Routes
Provides real-time user statistics and dashboard data
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from api.auth.utils import get_current_user
from api.database.mongodb import get_database
from api.services.xp_service import XPService

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get comprehensive dashboard statistics for the current user"""
    try:
        # Award XP for viewing dashboard
        xp_service = XPService(db)
        await xp_service.award_xp(
            user_id=current_user["user_id"],
            activity_type="dashboard_viewed",
            description="Viewed dashboard statistics"
        )
        
        # Get XP stats and user info directly
        xp_stats = await xp_service.get_user_xp_stats(current_user["user_id"])
        
        # Get basic user and prediction data
        user_doc = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
            
        predictions_made = await db.predictions.count_documents({"user_id": ObjectId(current_user["user_id"])})
        
        # Get recent predictions
        recent_predictions = await db.predictions.find({
            "user_id": ObjectId(current_user["user_id"])
        }).sort("created_at", -1).limit(5).to_list(length=5)
        
        # Format predictions data
        formatted_predictions = []
        for pred in recent_predictions:
            formatted_predictions.append({
                "id": str(pred["_id"]),
                "symbol": pred.get("symbol", "N/A"),
                "prediction_type": pred.get("prediction_type", "unknown"),
                "created_at": pred.get("created_at").isoformat() if pred.get("created_at") else None,
                "status": pred.get("status", "pending")
            })
        
        stats = {
            "total_predictions": predictions_made,
            "recent_predictions": formatted_predictions,
            "user_role": user_doc.get("role", "beginner"),
            "xp_info": {
                "total_xp": xp_stats.get("total_xp", 0),
                "current_role": xp_stats.get("current_role", "beginner"),
                "next_role_info": xp_stats.get("next_role_info")
            }
        }
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")

@router.get("/activity")
async def get_activity_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user activity statistics for profile page"""
    try:
        # Get XP-based activity data directly
        xp_service = XPService(db)
        xp_stats = await xp_service.get_user_xp_stats(current_user["user_id"])
        
        if "error" in xp_stats:
            raise HTTPException(status_code=500, detail=f"XP stats error: {xp_stats['error']}")
        
        # Get user data for additional info - handle both ObjectId and string formats
        user_id = current_user["user_id"]
        user_doc = None
        
        # Try ObjectId format first
        if ObjectId.is_valid(user_id):
            user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        
        # If not found, try string format
        if not user_doc:
            user_doc = await db.users.find_one({"_id": user_id})
            
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get actual counts from database - use same flexible approach
        user_id_obj = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        predictions_made = await db.predictions.count_documents({"user_id": user_id_obj})
        
        watchlist_doc = await db.watchlists.find_one({"user_id": user_id_obj})
        stocks_watched = len(watchlist_doc.get("items", [])) if watchlist_doc else 0
        
        # Calculate activity streak from XP activities
        recent_logins = await db.xp_activities.find({
            "user_id": user_id,  # Use string format for XP activities
            "activity_type": "daily_login"
        }).sort("earned_at", -1).limit(30).to_list(length=30)
        
        current_streak = 0
        longest_streak = 0
        last_activity = None
        
        if recent_logins:
            last_activity = recent_logins[0]["earned_at"].date().isoformat()
            # Simple streak calculation
            today = datetime.now(timezone.utc).date()
            if recent_logins[0]["earned_at"].date() >= today - timedelta(days=1):
                current_streak = 1  # At least 1 if logged in recently
            longest_streak = min(len(recent_logins), 7)  # Simple approximation
        
        return {
            "predictions_made": predictions_made,
            "stocks_watched": stocks_watched,
            "last_login": user_doc.get("last_login").isoformat() if user_doc.get("last_login") else None,
            "account_created": user_doc.get("created_at").isoformat() if user_doc.get("created_at") else None,
            "activity_streak": {
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "last_activity": last_activity
            },
            "xp_info": {
                "total_xp": xp_stats.get("total_xp", 0),
                "current_role": xp_stats.get("current_role", "beginner"),
                "active_goals": 0,  # No goals system implemented yet
                "completed_goals": 0  # No goals system implemented yet
            },
            "user_role": user_doc.get("role", "beginner"),
            "total_xp": xp_stats.get("total_xp", 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get activity stats: {str(e)}")

@router.get("/real-time")
async def get_real_time_metrics(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get real-time metrics that update frequently"""
    try:
        # Get basic real-time metrics
        user_id = ObjectId(current_user["user_id"])
        
        # Count predictions made today
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        predictions_today = await db.predictions.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": today}
        })
        
        # Get total XP
        xp_service = XPService(db)
        xp_stats = await xp_service.get_user_xp_stats(current_user["user_id"])
        
        return {
            "predictions_today": predictions_today,
            "total_xp": xp_stats.get("total_xp", 0),
            "current_role": xp_stats.get("current_role", "beginner"),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get real-time metrics: {str(e)}")

@router.get("/predictions/recent")
async def get_recent_predictions(
    limit: Optional[int] = 10,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get recent predictions with detailed information"""
    try:
        # Get recent predictions directly from database
        user_id = ObjectId(current_user["user_id"])
        
        # Get total count
        total_count = await db.predictions.count_documents({"user_id": user_id})
        
        # Get recent predictions
        recent_predictions = await db.predictions.find({
            "user_id": user_id
        }).sort("created_at", -1).limit(limit).to_list(length=limit)
        
        # Format predictions data
        formatted_predictions = []
        for pred in recent_predictions:
            formatted_predictions.append({
                "id": str(pred["_id"]),
                "symbol": pred.get("symbol", "N/A"),
                "prediction_type": pred.get("prediction_type", "unknown"),
                "created_at": pred.get("created_at").isoformat() if pred.get("created_at") else None,
                "status": pred.get("status", "pending"),
                "target_price": pred.get("target_price"),
                "confidence": pred.get("confidence")
            })
        
        return {
            "predictions": formatted_predictions,
            "total_count": total_count,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent predictions: {str(e)}")

@router.get("/summary")
async def get_dashboard_summary(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a lightweight summary for dashboard header/cards"""
    try:
        user_id = ObjectId(current_user["user_id"])
        
        # Get basic stats efficiently
        total_predictions = await db.predictions.count_documents({"user_id": user_id})
        
        # Get watchlist items count
        watchlist_doc = await db.watchlists.find_one({"user_id": user_id})
        watchlist_items = len(watchlist_doc.get("items", [])) if watchlist_doc else 0
        
        # Return lightweight summary
        return {
            "total_predictions": total_predictions,
            "model_accuracy": 0.0,  # Placeholder - would need actual calculation
            "watchlist_items": watchlist_items, 
            "active_models": 1,  # Placeholder - would track active ML models
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard summary: {str(e)}")

@router.get("/activity-streak")
async def get_activity_streak(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user activity streak information"""
    try:
        user_id = ObjectId(current_user["user_id"])
        xp_service = XPService(db)
        
        # Calculate activity streak from XP activities
        recent_logins = await db.xp_activities.find({
            "user_id": user_id,
            "activity_type": "daily_login"
        }).sort("earned_at", -1).limit(30).to_list(length=30)
        
        current_streak = 0
        longest_streak = 0
        last_activity = None
        
        if recent_logins:
            last_activity = recent_logins[0]["earned_at"].date().isoformat()
            # Simple streak calculation
            today = datetime.now(timezone.utc).date()
            if recent_logins[0]["earned_at"].date() >= today - timedelta(days=1):
                current_streak = 1  # At least 1 if logged in recently
            longest_streak = min(len(recent_logins), 7)  # Simple approximation
        
        # Get XP info
        xp_stats = await xp_service.get_user_xp_stats(current_user["user_id"])
        
        return {
            "streak_info": {
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "last_activity": last_activity
            },
            "xp_info": {
                "total_xp": xp_stats.get("total_xp", 0),
                "current_role": xp_stats.get("current_role", "beginner")
            },
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get activity streak: {str(e)}")

@router.post("/refresh")
async def refresh_dashboard_data(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Force refresh of dashboard data (useful for testing)"""
    try:
        # Simply return success - actual refresh would involve cache clearing in a real system
        user_id = ObjectId(current_user["user_id"])
        
        # Get some basic current stats to verify the refresh
        total_predictions = await db.predictions.count_documents({"user_id": user_id})
        
        xp_service = XPService(db)
        xp_stats = await xp_service.get_user_xp_stats(current_user["user_id"])
        
        return {
            "success": True,
            "message": "Dashboard data refreshed successfully",
            "data": {
                "total_predictions": total_predictions,
                "total_xp": xp_stats.get("total_xp", 0),
                "current_role": xp_stats.get("current_role", "beginner")
            },
            "refreshed_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh dashboard data: {str(e)}")

@router.get("/xp")
async def get_xp_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get detailed XP and role progression statistics"""
    try:
        xp_service = XPService(db)
        xp_stats = await xp_service.get_user_xp_stats(current_user["user_id"])
        
        return {
            "success": True,
            "data": xp_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get XP stats: {str(e)}")

@router.get("/leaderboard")
async def get_xp_leaderboard(
    limit: Optional[int] = 10,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get XP leaderboard"""
    try:
        xp_service = XPService(db)
        leaderboard = await xp_service.get_leaderboard(limit)
        
        return {
            "success": True,
            "data": leaderboard
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")

@router.get("/health")
async def dashboard_health_check():
    """Health check endpoint for dashboard API"""
    return {
        "status": "healthy",
        "service": "dashboard-api",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
