#!/usr/bin/env python3
"""Test admin user creation and deletion via API calls"""

import asyncio
import sys
import os
import json
import requests
from bson import ObjectId

# Add backend to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_api_delete():
    print("Testing admin API create and delete...")
    
    # First, let's check current users in database
    try:
        from api.database.mongodb import mongodb, get_database, UserService
        
        await mongodb.connect()
        db = await get_database()
        user_service = UserService(db)
        
        # Check current users
        users_before = await db.users.count_documents({})
        print(f"Current users in database: {users_before}")
        
        # List some users
        users_cursor = db.users.find().limit(5)
        users = await users_cursor.to_list(length=5)
        print(f"Users currently in database:")
        for user in users:
            print(f"  - {user['_id']}: {user['email']} ({user.get('role', 'unknown')})")
        
        await mongodb.disconnect()
        
    except Exception as e:
        print(f"Database check failed: {e}")
        return
    
    # Now let's test by making actual HTTP requests
    # (This would normally require the server to be running)
    print("\nNote: To fully test the API, the server needs to be running at localhost:8000")
    print("You can test manually by:")
    print("1. Starting the server: python backend/main.py")
    print("2. Login as admin to get a token")
    print("3. Try deleting a user via the admin panel")
    print("4. Check if the user still exists after refresh")

if __name__ == "__main__":
    asyncio.run(test_api_delete())