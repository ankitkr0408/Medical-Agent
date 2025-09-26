#!/usr/bin/env python3
"""
Test script to verify the Medical Image Analysis Platform setup
"""

import sys
import os

def test_imports():
    """Test all required imports"""
    print("🧪 Testing imports...")
    
    try:
        import streamlit as st
        print("✅ Streamlit imported successfully")
    except ImportError as e:
        print(f"❌ Streamlit import failed: {e}")
        return False
    
    try:
        import pymongo
        print("✅ PyMongo imported successfully")
    except ImportError as e:
        print(f"❌ PyMongo import failed: {e}")
        return False
    
    try:
        import openai
        print("✅ OpenAI imported successfully")
    except ImportError as e:
        print(f"❌ OpenAI import failed: {e}")
        return False
    
    try:
        import cv2
        print("✅ OpenCV imported successfully")
    except ImportError as e:
        print(f"❌ OpenCV import failed: {e}")
        return False
    
    try:
        import pydicom
        print("✅ PyDICOM imported successfully")
    except ImportError as e:
        print(f"❌ PyDICOM import failed: {e}")
        return False
    
    try:
        import nibabel
        print("✅ NiBabel imported successfully")
    except ImportError as e:
        print(f"❌ NiBabel import failed: {e}")
        return False
    
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        print("✅ Scikit-learn imported successfully")
    except ImportError as e:
        print(f"❌ Scikit-learn import failed: {e}")
        return False
    
    return True

def test_mongodb_connection():
    """Test MongoDB connection"""
    print("\n🔗 Testing MongoDB connection...")
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        from db import client
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def test_env_variables():
    """Test environment variables"""
    print("\n🔧 Testing environment variables...")
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        mongo_uri = os.getenv("MONGO_URI")
        if mongo_uri:
            print("✅ MONGO_URI found in environment")
        else:
            print("⚠️ MONGO_URI not found in environment")
        
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key and openai_key != "sk":
            print("✅ OPENAI_API_KEY found in environment")
        else:
            print("⚠️ OPENAI_API_KEY not properly configured")
        
        return True
    except Exception as e:
        print(f"❌ Environment variable test failed: {e}")
        return False

def test_app_modules():
    """Test application modules"""
    print("\n📦 Testing application modules...")
    
    try:
        import app
        print("✅ Main app module imported successfully")
    except Exception as e:
        print(f"❌ Main app import failed: {e}")
        return False
    
    try:
        import auth_system
        print("✅ Auth system imported successfully")
    except Exception as e:
        print(f"❌ Auth system import failed: {e}")
        return False
    
    try:
        import utils_simple
        print("✅ Utils module imported successfully")
    except Exception as e:
        print(f"❌ Utils module import failed: {e}")
        return False
    
    try:
        import chat_system
        print("✅ Chat system imported successfully")
    except Exception as e:
        print(f"❌ Chat system import failed: {e}")
        return False
    
    try:
        import dashboard
        print("✅ Dashboard imported successfully")
    except Exception as e:
        print(f"❌ Dashboard import failed: {e}")
        return False
    
    try:
        import report_qa_chat
        print("✅ QA chat system imported successfully")
    except Exception as e:
        print(f"❌ QA chat system import failed: {e}")
        return False
    
    try:
        import qa_interface
        print("✅ QA interface imported successfully")
    except Exception as e:
        print(f"❌ QA interface import failed: {e}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("🏥 Medical Image Analysis Platform - Setup Test")
    print("=" * 60)
    
    all_passed = True
    
    # Test imports
    if not test_imports():
        all_passed = False
    
    # Test environment variables
    if not test_env_variables():
        all_passed = False
    
    # Test MongoDB connection
    if not test_mongodb_connection():
        all_passed = False
    
    # Test application modules
    if not test_app_modules():
        all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 All tests passed! Your setup is ready.")
        print("\n🚀 To start the application, run:")
        print("   - Windows: start_app.bat or start_app.ps1")
        print("   - Manual: streamlit run app.py --server.port 8502")
        print("\n🌐 The app will be available at: http://localhost:8502")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())