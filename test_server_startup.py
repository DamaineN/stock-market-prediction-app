#!/usr/bin/env python3
"""Test server startup and MongoDB connection"""

import asyncio
import sys
import os

# Add backend to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_startup():
    try:
        # Import and test the lifespan startup logic
        from api.database.mongodb import mongodb
        from config.settings import settings
        
        print("Testing server startup sequence...")
        print(f"MongoDB URL: {settings.mongodb_connection_string}")
        print(f"Database Name: {settings.mongodb_database_name}")
        
        # Test MongoDB connection like the server does
        try:
            await mongodb.connect()
            print("✅ MongoDB connected successfully")
            
            # Test database operations
            db = mongodb.database
            if db is not None:
                users_count = await db.users.count_documents({})
                print(f"✅ Database is working - found {users_count} users")
            else:
                print("❌ Database connection failed - db is None")
                
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}. Server would run without database.")
            
        await mongodb.disconnect()
        print("\n✅ Startup test completed")
        
    except Exception as e:
        print(f"❌ Startup test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_startup())