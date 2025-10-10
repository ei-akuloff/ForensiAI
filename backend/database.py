"""
MongoDB Database Configuration and Connection
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ufdr_investigation")

# Global variables for database connections
mongodb_client: Optional[AsyncIOMotorClient] = None
database = None


async def connect_to_mongodb():
    """
    Connect to MongoDB database (async)
    """
    global mongodb_client, database
    try:
        mongodb_client = AsyncIOMotorClient(MONGODB_URL)
        database = mongodb_client[MONGODB_DB_NAME]
        
        # Test connection
        await database.command('ping')
        print(f"✅ Connected to MongoDB: {MONGODB_DB_NAME}")
        
        # Create indexes for better performance
        await create_indexes()
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {str(e)}")
        raise


async def close_mongodb_connection():
    """
    Close MongoDB database connection
    """
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("MongoDB connection closed")


async def create_indexes():
    """
    Create database indexes for better query performance
    """
    try:
        # Cases collection indexes
        await database.cases.create_index("case_id", unique=True)
        await database.cases.create_index("created_at")
        await database.cases.create_index("status")
        
        # Users collection indexes
        await database.users.create_index("email", unique=True)
        await database.users.create_index("username", unique=True)
        
        # Sessions collection indexes
        await database.sessions.create_index("session_id", unique=True)
        await database.sessions.create_index("case_id")
        await database.sessions.create_index("created_at")
        
        # Analysis results collection indexes
        await database.analysis_results.create_index("session_id")
        await database.analysis_results.create_index("case_id")
        await database.analysis_results.create_index("analysis_type")
        
        # Relationships collection indexes
        await database.relationships.create_index("session_id")
        await database.relationships.create_index("case_id")
        
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"⚠️  Error creating indexes: {str(e)}")


def get_database():
    """
    Get database instance (for dependency injection)
    """
    return database


# Synchronous client for non-async operations
sync_client = None
sync_database = None

def get_sync_database():
    """
    Get synchronous database connection
    """
    global sync_client, sync_database
    if sync_client is None:
        sync_client = MongoClient(MONGODB_URL)
        sync_database = sync_client[MONGODB_DB_NAME]
    return sync_database
