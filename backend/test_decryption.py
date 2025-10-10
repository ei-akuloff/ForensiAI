#!/usr/bin/env python3
"""
Test script to verify decryption is working properly
"""
import requests
import json
import os

def test_decryption():
    """Test the decryption endpoint with a simple request"""
    
    # Test data - you'll need to replace with actual files
    test_data = {
        'session_id': 'test_session_123',
        'decryption_key': json.dumps({
            "key_base64": "test_key_base64",
            "iv_base64": "test_iv_base64"
        }),
        'hash_value': 'test_hash'
    }
    
    # Check if server is running
    try:
        response = requests.get('http://localhost:8000/')
        print(f"✅ Server is running: {response.json()}")
    except Exception as e:
        print(f"❌ Server not running: {e}")
        return
    
    # Test the encrypted upload endpoint
    try:
        # This will fail because we don't have real files, but we can see the error
        response = requests.post('http://localhost:8000/upload-encrypted-ufdr/', 
                              data=test_data)
        print(f"Response status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Test request error: {e}")

if __name__ == "__main__":
    test_decryption()
