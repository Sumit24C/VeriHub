from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from app.core.config import settings

client = None
database = None

async def connect_to_mongo():
    """Create database connection"""
    global client, database
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL, server_api=ServerApi('1'))
        database = client[settings.DATABASE_NAME]
        
        # Test the connection
        await client.admin.command('ping')
        print(f"Successfully connected to MongoDB database: {settings.DATABASE_NAME}")

    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")

async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB!")
    else:
        print("No MongoDB connection to close")

def get_database():
    return database
