#!/usr/bin/env python3
"""Debug ObjectId conversion for the failing user"""

import asyncio
import sys
import os
from bson import ObjectId

# Add backend to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def debug_objectid():
    try:
        from api.database.mongodb import mongodb, get_database, UserService
        
        await mongodb.connect()
        db = await get_database()
        user_service = UserService(db)
        
        # The failing user ID from the logs
        user_id = "68f1c47ad15105cd4b0d9598"
        print(f"Debugging user ID: {user_id}")
        
        # Check if it's a valid ObjectId
        print(f"Is valid ObjectId: {ObjectId.is_valid(user_id)}")
        
        # Try to convert to ObjectId
        try:
            user_obj_id = ObjectId(user_id)
            print(f"ObjectId conversion successful: {user_obj_id}")
        except Exception as e:
            print(f"ObjectId conversion failed: {e}")
            return
        
        # Check if user exists using the service (which handles both ObjectId and string)
        user_via_service = await user_service.get_user_by_id(user_id)
        if user_via_service:
            print(f"✅ User found via UserService: {user_via_service['email']}")
            print(f"   User _id type: {type(user_via_service['_id'])}")
            print(f"   User _id value: {user_via_service['_id']}")
        else:
            print("❌ User NOT found via UserService")
        
        # Try direct database query with ObjectId
        user_via_objectid = await db.users.find_one({"_id": user_obj_id})
        if user_via_objectid:
            print(f"✅ User found via ObjectId query: {user_via_objectid['email']}")
        else:
            print("❌ User NOT found via ObjectId query")
            
        # Try direct database query with string
        user_via_string = await db.users.find_one({"_id": user_id})
        if user_via_string:
            print(f"✅ User found via string query: {user_via_string['email']}")
        else:
            print("❌ User NOT found via string query")
            
        # List all users to see their _id formats
        print("\nAll users in database:")
        users_cursor = db.users.find()
        users = await users_cursor.to_list(length=10)
        for user in users:
            print(f"  - _id: {user['_id']} (type: {type(user['_id'])}) - {user['email']}")
            
        await mongodb.disconnect()
        
    except Exception as e:
        print(f"❌ Debug failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_objectid())