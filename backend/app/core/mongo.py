"""
MongoDB connection via Motor (async driver).
Used for semi-structured content: transcripts, summaries, key moments.
"""
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
mongo_db = mongo_client[settings.MONGO_DB_NAME]

# Collections used across the app
transcripts_collection = mongo_db["transcripts"]
summaries_collection = mongo_db["summaries"]
key_moments_collection = mongo_db["key_moments"]
bookmarks_collection = mongo_db["bookmarks"]
video_views_collection = mongo_db["video_views"]