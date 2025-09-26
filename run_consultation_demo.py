#!/usr/bin/env python3
"""
Simple script to run the consultation demo
"""

import subprocess
import sys
import os

def check_requirements():
    """Check if required packages are installed"""
    required_packages = ['streamlit', 'openai', 'pymongo', 'python-dotenv']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("📦 Installing missing packages...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing_packages)
        print("✅ Packages installed!")
    else:
        print("✅ All required packages are installed!")

def main():
    print("🏥 Medical Image Analysis - Consultation System")
    print("=" * 50)
    
    # Check requirements
    check_requirements()
    
    print("\n🚀 Choose how to run the system:")
    print("1. 📋 Demo Mode (consultation_demo.py) - See how it works")
    print("2. 🧪 Test Mode (test_consultation.py) - Interactive testing")
    print("3. 🏥 Full App (app.py) - Complete medical analysis system")
    print("4. ❌ Exit")
    
    while True:
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == "1":
            print("\n🎯 Starting Demo Mode...")
            print("This will show you how the new consultation system works")
            subprocess.run([sys.executable, '-m', 'streamlit', 'run', 'consultation_demo.py'])
            break
            
        elif choice == "2":
            print("\n🧪 Starting Test Mode...")
            print("This will let you test the consultation features interactively")
            subprocess.run([sys.executable, '-m', 'streamlit', 'run', 'test_consultation.py'])
            break
            
        elif choice == "3":
            print("\n🏥 Starting Full Application...")
            print("This will run the complete medical analysis system")
            print("Make sure you have:")
            print("- ✅ OpenAI API key in .env file")
            print("- ✅ MongoDB running")
            print("- ✅ User account created")
            
            confirm = input("\nReady to start? (y/n): ").strip().lower()
            if confirm in ['y', 'yes']:
                subprocess.run([sys.executable, '-m', 'streamlit', 'run', 'app.py'])
            break
            
        elif choice == "4":
            print("👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid choice. Please enter 1, 2, 3, or 4.")

if __name__ == "__main__":
    main()