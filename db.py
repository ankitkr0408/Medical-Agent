# -*- coding: utf-8 -*-
import os
import sys
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import json
from datetime import datetime

# Set UTF-8 encoding for console output on Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

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
class QueryResult:
    """Helper class to support MongoDB-style method chaining for LocalStorage"""
    def __init__(self, data):
        self.data = data
        self._sort_field = None
        self._sort_direction = 1
        self._limit_count = None
    
    def sort(self, field, direction=1):
        """Sort results by field"""
        self._sort_field = field
        self._sort_direction = direction
        return self
    
    def limit(self, count):
        """Limit number of results"""
        self._limit_count = count
        return self
    
    def __iter__(self):
        """Make the object iterable"""
        results = self.data
        
        # Apply sorting if specified
        if self._sort_field and results:
            try:
                results = sorted(results, 
                               key=lambda x: x.get(self._sort_field, ''),
                               reverse=(self._sort_direction == -1))
            except:
                pass  # If sorting fails, return unsorted
        
        # Apply limit if specified
        if self._limit_count:
            results = results[:self._limit_count]
        
        return iter(results)

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
    
    def find(self, query=None, projection=None):
        if query is None:
            results = self.data[:]
        else:
            # Simple query matching for common cases
            results = []
            for item in self.data:
                match = True
                for key, value in query.items():
                    # Handle $regex queries
                    if isinstance(value, dict) and '$regex' in value:
                        pattern = value['$regex']
                        if key in item and isinstance(item[key], str):
                            if not item[key].startswith(pattern.replace('^', '')):
                                match = False
                                break
                        else:
                            match = False
                            break
                    elif key not in item or item[key] != value:
                        match = False
                        break
                if match:
                    results.append(item)
        
        # Apply projection if provided (simple implementation)
        if projection:
            filtered_results = []
            for item in results:
                filtered_item = {}
                for key, value in item.items():
                    # If projection excludes _id or other fields with value 0, skip them
                    if key in projection and projection[key] == 0:
                        continue
                    # If projection includes specific fields with value 1, only include those
                    elif projection and any(v == 1 for v in projection.values()):
                        if key in projection and projection[key] == 1:
                            filtered_item[key] = value
                    else:
                        filtered_item[key] = value
                filtered_results.append(filtered_item)
            return QueryResult(filtered_results)
        
        return QueryResult(results)
    
    def find_one(self, query, projection=None):
        results = list(self.find(query, projection))
        return results[0] if results else None
    
    def delete_one(self, query):
        """Delete one document matching the query"""
        for i, item in enumerate(self.data):
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                del self.data[i]
                self._save_data()
                return type('DeleteResult', (), {'deleted_count': 1})()
        return type('DeleteResult', (), {'deleted_count': 0})()
    
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
                if '$push' in update:
                    # Support for $push operation (used in chat messages)
                    for key, value in update['$push'].items():
                        if key not in item:
                            item[key] = []
                        if isinstance(item[key], list):
                            item[key].append(value)
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
