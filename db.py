import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# Get MongoDB URI from .env
MONGO_URI = os.getenv("MONGO_URI")

# Global variables for fallback
mongodb_connected = False
client = None
db = None

# Try to connect to MongoDB
try:
    client = MongoClient(MONGO_URI, server_api=ServerApi('1'), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("✅ Connected to MongoDB Atlas successfully!")
    mongodb_connected = True
    db = client.get_default_database()
except Exception as e:
    print("❌ MongoDB connection failed:", e)
    print("🔄 Running in offline mode with local storage fallback")
    mongodb_connected = False

# Fallback storage class for offline mode
class LocalStorage:
    def __init__(self, collection_name):
        self.collection_name = collection_name
        self.file_path = f"local_data_{collection_name}.json"
        self.data = self._load_data()
    
    def _load_data(self):
        try:
            if os.path.exists(self.file_path):
                with open(self.file_path, 'r') as f:
                    return json.load(f)
        except:
            pass
        return []
    
    def _save_data(self):
        try:
            with open(self.file_path, 'w') as f:
                json.dump(self.data, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving local data: {e}")
    
    def insert_one(self, document):
        document['_id'] = len(self.data) + 1
        document['created_at'] = datetime.now().isoformat()
        self.data.append(document)
        self._save_data()
        return type('InsertResult', (), {'inserted_id': document['_id']})()
    
    def find(self, query=None):
        if query is None:
            return self.data
        # Simple query matching for common cases
        results = []
        for item in self.data:
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                results.append(item)
        return results
    
    def find_one(self, query):
        results = self.find(query)
        return results[0] if results else None
    
    def update_one(self, query, update):
        for item in self.data:
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                if '$set' in update:
                    item.update(update['$set'])
                self._save_data()
                return type('UpdateResult', (), {'modified_count': 1})()
        return type('UpdateResult', (), {'modified_count': 0})()

# Collections - use MongoDB if connected, otherwise use local storage
if mongodb_connected:
    users_collection = db["users"]
    chats_collection = db["chats"]
    qa_chat_collection = db["qa_chats"]
    qa_analysis_collection = db["qa_analyses"]
else:
    users_collection = LocalStorage("users")
    chats_collection = LocalStorage("chats")
    qa_chat_collection = LocalStorage("qa_chats")
    qa_analysis_collection = LocalStorage("qa_analyses")

def get_db():
    """Return the database object"""
    return db
