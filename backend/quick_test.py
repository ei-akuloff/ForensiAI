#!/usr/bin/env python3
"""
Quick test to verify the session fix is working.
"""

import requests
import json
import time
import os

def test_session_fix():
    """Test the session fix with a simple upload and query."""
    
    BASE_URL = "http://localhost:8000"
    
    print("Testing Session Fix...")
    
    # Test 1: Check backend health
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("OK - Backend is running")
        else:
            print(f"ERROR - Backend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"ERROR - Cannot connect to backend: {e}")
        return False
    
    # Test 2: Upload a test file
    session_id = f"test_{int(time.time())}"
    manifest_path = "../ufdr_full/manifest.json"
    
    if not os.path.exists(manifest_path):
        print("ERROR - Test file not found. Please ensure you're in the backend directory.")
        return False
    
    print(f"Uploading test file with session: {session_id}")
    
    try:
        with open(manifest_path, 'rb') as f:
            files = {'file': ('manifest.json', f, 'application/json')}
            data = {'session_id': session_id}
            
            response = requests.post(f"{BASE_URL}/upload-single-json/", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"OK - Upload successful - Session: {result.get('session_id')}, Chunks: {result.get('chunks')}")
            else:
                print(f"ERROR - Upload failed: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        print(f"ERROR - Upload error: {e}")
        return False
    
    # Test 3: Query the uploaded data
    print("Testing query...")
    
    try:
        query_data = {
            'query': 'What information is available in this dataset?',
            'session_id': session_id
        }
        
        response = requests.post(f"{BASE_URL}/query/", data=query_data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"OK - Query successful!")
            print(f"   Response: {result.get('response', 'No response')[:100]}...")
            print(f"   Context used: {result.get('context_used')}")
            return True
        else:
            print(f"ERROR - Query failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"ERROR - Query error: {e}")
        return False

if __name__ == "__main__":
    print("Quick Session Fix Test")
    print("=" * 40)
    
    if test_session_fix():
        print("\nSUCCESS! The session fix is working!")
        print("\nYou can now:")
        print("1. Upload files through the frontend")
        print("2. Chat with the AI without session errors")
        print("3. Use all the forensic data types")
    else:
        print("\nFAILED! Please check the issues above.")
        print("\nMake sure:")
        print("1. Backend is running: python main.py")
        print("2. You're in the backend directory")
        print("3. Test files exist in ../ufdr_full/")
