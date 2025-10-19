#!/usr/bin/env python3
"""Test user deletion functionality"""

import asyncio
import sys
import os
from bson import ObjectId

# Add backend to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_user_deletion():
    try:
        from api.database.mongodb import mongodb, get_database, UserService
        
        print("Testing user deletion functionality...")
        
        # Connect to database
        await mongodb.connect()
        db = await get_database()
        user_service = UserService(db)
        
        # Create a test user
        test_user_data = {
            "_id": ObjectId(),
            "email": "test_delete@example.com",
            "full_name": "Test Delete User",
            "role": "beginner",
            "status": "active",
            "hashed_password": "dummy_password",
            "is_verified": False,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
        
        # Insert test user
        result = await db.users.insert_one(test_user_data)
        test_user_id = str(result.inserted_id)
        print(f"✅ Created test user with ID: {test_user_id}")
        
        # Verify user exists
        user_before = await user_service.get_user_by_id(test_user_id)
        if user_before:
            print(f"✅ User exists before deletion: {user_before['email']}")
        else:
            print("❌ Test user not found before deletion")
            return
        
        # Test the delete operation (hard delete using ObjectId)
        user_obj_id = ObjectId(test_user_id)
        delete_result = await db.users.delete_one({"_id": user_obj_id})
        
        print(f"Delete operation result: {delete_result.deleted_count} document(s) deleted")
        
        # Verify user is gone
        user_after = await user_service.get_user_by_id(test_user_id)
        if user_after:
            print(f"❌ User still exists after deletion: {user_after['email']}")
        else:
            print("✅ User successfully deleted from database")
        
        await mongodb.disconnect()
        print("\n✅ User deletion test completed")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_user_deletion())