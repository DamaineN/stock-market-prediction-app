#!/usr/bin/env python3
"""Test MongoDB connection and check if users can be deleted"""

import asyncio
import sys
import os

# Add backend to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_db_connection():
    try:
        from api.database.mongodb import mongodb, get_database, UserService
        from config.settings import settings
        
        print("Testing MongoDB connection...")
        
        # Connect to database
        await mongodb.connect()
        
        print(f"✅ Connected to MongoDB")
        print(f"Database name: {mongodb.database.name}")
        
        # Get database instance
        db = await get_database()
        user_service = UserService(db)
        
        # Count total users
        total_users = await db.users.count_documents({})
        print(f"Total users in database: {total_users}")
        
        # List first few users
        users_cursor = db.users.find().limit(3)
        users = await users_cursor.to_list(length=3)
        
        print("\nFirst few users:")
        for user in users:
            print(f"- ID: {user['_id']}, Email: {user['email']}, Status: {user.get('status', 'unknown')}")
            
        await mongodb.disconnect()
        print("\n✅ Database test completed successfully")
        
    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_db_connection())