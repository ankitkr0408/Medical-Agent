import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get MongoDB URI from .env
MONGO_URI = os.getenv("MONGO_URI")

# Create MongoClient
client = MongoClient(MONGO_URI, server_api=ServerApi('1'))

# Test connection
try:
    client.admin.command('ping')
    print("✅ Connected to MongoDB Atlas successfully!")
except Exception as e:
    print("❌ Connection failed:", e)

# Select database
db = client.get_default_database()  # Automatically picks DB from URI

# Collections
users_collection = db["users"]
chats_collection = db["chats"]
qa_chat_collection = db["qa_chats"]
qa_analysis_collection = db["qa_analyses"]

def get_db():
    """Return the database object"""
    return db
