#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Medical Image Analysis Platform Setup Script
This script sets up the virtual environment and installs all dependencies
"""

import os
import sys
import subprocess
import platform

# Set UTF-8 encoding for console output on Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def run_command(command, shell=True):
    """Run a command and return success status"""
    try:
        result = subprocess.run(command, shell=shell, check=True, capture_output=True, text=True)
        print(f"✅ {command}")
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {command}")
        print(f"Error: {e.stderr}")
        return False, e.stderr

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def setup_virtual_environment():
    """Create and activate virtual environment"""
    print("\n🔧 Setting up virtual environment...")
    
    # Check if venv already exists
    if os.path.exists("venv"):
        print("📁 Virtual environment already exists")
        return True
    
    # Create virtual environment
    success, output = run_command("python -m venv venv")
    if not success:
        print("❌ Failed to create virtual environment")
        return False
    
    print("✅ Virtual environment created successfully")
    return True

def install_dependencies():
    """Install all required dependencies"""
    print("\n📦 Installing dependencies...")
    
    # Determine the correct pip path based on OS
    if platform.system() == "Windows":
        pip_path = os.path.join("venv", "Scripts", "pip")
        python_path = os.path.join("venv", "Scripts", "python")
    else:
        pip_path = os.path.join("venv", "bin", "pip")
        python_path = os.path.join("venv", "bin", "python")
    
    # Upgrade pip first
    success, output = run_command(f"{python_path} -m pip install --upgrade pip")
    if not success:
        print("⚠️ Failed to upgrade pip, continuing anyway...")
    
    # Install requirements
    success, output = run_command(f"{pip_path} install -r requirements.txt")
    if not success:
        print("❌ Failed to install dependencies")
        return False
    
    print("✅ All dependencies installed successfully")
    return True

def test_mongodb_connection():
    """Test MongoDB connection"""
    print("\n🔗 Testing MongoDB connection...")
    
    try:
        # Import after installation
        from dotenv import load_dotenv
        from pymongo import MongoClient
        from pymongo.server_api import ServerApi
        
        load_dotenv()
        mongo_uri = os.getenv("MONGO_URI")
        
        if not mongo_uri:
            print("⚠️ MONGO_URI not found in .env file")
            return False
        
        client = MongoClient(mongo_uri, server_api=ServerApi('1'))
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {str(e)}")
        return False

def create_activation_script():
    """Create activation script for easy environment setup"""
    print("\n📝 Creating activation script...")
    
    if platform.system() == "Windows":
        script_content = """@echo off
echo Activating Medical Image Analysis Platform...
call venv\\Scripts\\activate.bat
echo ✅ Virtual environment activated
echo 🚀 Run 'streamlit run app.py' to start the application
cmd /k
"""
        with open("activate.bat", "w") as f:
            f.write(script_content)
        print("✅ Created activate.bat - double-click to activate environment")
    else:
        script_content = """#!/bin/bash
echo "Activating Medical Image Analysis Platform..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo "🚀 Run 'streamlit run app.py' to start the application"
bash
"""
        with open("activate.sh", "w") as f:
            f.write(script_content)
        os.chmod("activate.sh", 0o755)
        print("✅ Created activate.sh - run './activate.sh' to activate environment")

def main():
    """Main setup function"""
    print("🏥 Medical Image Analysis Platform Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Setup virtual environment
    if not setup_virtual_environment():
        return False
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Test MongoDB connection
    test_mongodb_connection()
    
    # Create activation script
    create_activation_script()
    
    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Activate the virtual environment:")
    if platform.system() == "Windows":
        print("   - Double-click activate.bat OR")
        print("   - Run: venv\\Scripts\\activate")
    else:
        print("   - Run: ./activate.sh OR")
        print("   - Run: source venv/bin/activate")
    
    print("2. Start the application:")
    print("   streamlit run app.py")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)