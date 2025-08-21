from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "verihub")

client = None
database = None

async def connect_to_mongo():
    """Create database connection"""
    global client, database
    client = AsyncIOMotorClient(MONGODB_URL, server_api=ServerApi('1'))
    database = client[DATABASE_NAME]
    print("Connected to MongoDB!")

async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB!")

def get_database():
    return database