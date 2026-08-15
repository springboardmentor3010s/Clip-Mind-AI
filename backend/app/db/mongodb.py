"""
MongoDB connection setup using Motor (async driver).
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = AsyncIOMotorClient(settings.MONGO_URI)
mongo_db = client[settings.MONGO_DB_NAME]

transcripts_collection = mongo_db["transcripts"]
summaries_collection = mongo_db["summaries"]
key_moments_collection = mongo_db["key_moments"]


async def check_mongo_connection() -> bool:
    try:
        await client.admin.command("ping")
        return True
    except Exception as e:
        print(f"[MongoDB] Connection failed: {e}")
        return False