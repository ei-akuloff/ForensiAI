import requests
import json

def test_multilingual_response():
    """Test multilingual responses directly"""
    
    # Test cases with expected languages
    test_cases = [
        {
            "query": "chor kon hai?",
            "expected_language": "Hinglish",
            "description": "Hinglish forensic query"
        },
        {
            "query": "what files were found?",
            "expected_language": "English", 
            "description": "English query"
        },
        {
            "query": "kya pata chala hai?",
            "expected_language": "Hinglish",
            "description": "Another Hinglish query"
        }
    ]
    
    print("Testing Multilingual Response System")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['description']}")
        print(f"Query: '{test_case['query']}'")
        print(f"Expected Language: {test_case['expected_language']}")
        
        try:
            # Make request to backend
            response = requests.post(
                'http://localhost:8000/query/', 
                json={
                    'query': test_case['query'], 
                    'case_id': 'test_case_123'
                },
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Detected Language: {data.get('detected_language', 'None')}")
                print(f"📝 Response: {data.get('response', 'No response')[:200]}...")
                print(f"🔧 Debug Info: {data.get('debug_info', {})}")
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection Error: Backend server not running on localhost:8000")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print("-" * 40)

if __name__ == "__main__":
    test_multilingual_response()