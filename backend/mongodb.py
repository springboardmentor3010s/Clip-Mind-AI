from pymongo import MongoClient

MONGO_URL = "mongodb://localhost:27017"

client = MongoClient(MONGO_URL)

mongo_db = client["clipmind_ai"]

transcripts_collection = mongo_db["transcripts"]
summaries_collection = mongo_db["summaries"]
key_moments_collection = mongo_db["key_moments"]
keywords_collection = mongo_db["keywords"]
content_insights_collection = mongo_db["content_insights"]

print("MongoDB connected successfully")