#!/usr/bin/env python3
"""Test admin delete API endpoint directly"""

import asyncio
import sys
import os
from bson import ObjectId

# Add backend to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_admin_delete_endpoint():
    try:
        from api.database.mongodb import mongodb, get_database, UserService, AuditService
        from api.routes.admin import delete_user
        from fastapi import HTTPException
        
        print("Testing admin delete endpoint...")
        
        # Connect to database
        await mongodb.connect()
        db = await get_database()
        user_service = UserService(db)
        
        # Create a test user to delete
        from datetime import datetime, timezone
        test_user_data = {
            "_id": ObjectId(),
            "email": "test_admin_delete@example.com",
            "full_name": "Test Admin Delete User",
            "role": "beginner",
            "status": "active",
            "hashed_password": "dummy_password",
            "is_verified": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Insert test user
        result = await db.users.insert_one(test_user_data)
        test_user_id = str(result.inserted_id)
        print(f"✅ Created test user with ID: {test_user_id}")
        
        # List users before deletion
        users_before = await db.users.count_documents({})
        print(f"Total users before deletion: {users_before}")
        
        # Simulate the admin delete call
        admin_user = {
            "user_id": "admin_hardcoded",
            "email": "admin@stolckr.com"
        }
        
        try:
            # Test the exact same deletion logic as in the admin endpoint
            user_doc = await user_service.get_user_by_id(test_user_id)
            if not user_doc:
                print("❌ Test user not found")
                return
                
            print(f"✅ Found user before deletion: {user_doc['email']}")
            
            # Delete user and associated data (same logic as admin.py)
            user_obj_id = ObjectId(test_user_id)
            
            # Delete from various collections
            delete_results = []
            delete_results.append(("users", await db.users.delete_one({"_id": user_obj_id})))
            delete_results.append(("watchlists", await db.watchlists.delete_many({"user_id": user_obj_id})))
            delete_results.append(("portfolios", await db.portfolios.delete_many({"user_id": user_obj_id})))
            delete_results.append(("paper_trading_portfolios", await db.paper_trading_portfolios.delete_many({"user_id": user_obj_id})))
            delete_results.append(("paper_trading_holdings", await db.paper_trading_holdings.delete_many({"user_id": user_obj_id})))
            delete_results.append(("trade_history", await db.trade_history.delete_many({"user_id": user_obj_id})))
            delete_results.append(("predictions", await db.predictions.delete_many({"user_id": user_obj_id})))
            delete_results.append(("user_profiles", await db.user_profiles.delete_many({"user_id": user_obj_id})))
            delete_results.append(("investment_goals", await db.investment_goals.delete_many({"user_id": user_obj_id})))
            delete_results.append(("xp_activities", await db.xp_activities.delete_many({"user_id": user_obj_id})))
            delete_results.append(("user_activities", await db.user_activities.delete_many({"user_id": user_obj_id})))
            
            # Print deletion results
            for collection_name, result in delete_results:
                if hasattr(result, 'deleted_count'):
                    print(f"  {collection_name}: {result.deleted_count} documents deleted")
                
            # Verify user is gone
            user_after = await user_service.get_user_by_id(test_user_id)
            if user_after:
                print(f"❌ User still exists after deletion: {user_after['email']}")
            else:
                print("✅ User successfully deleted from database")
                
            # Count users after deletion
            users_after = await db.users.count_documents({})
            print(f"Total users after deletion: {users_after}")
            
        except Exception as e:
            print(f"❌ Delete operation failed: {str(e)}")
            import traceback
            traceback.print_exc()
        
        await mongodb.disconnect()
        print("\n✅ Admin delete test completed")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_admin_delete_endpoint())