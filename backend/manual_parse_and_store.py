"""
Manual script to parse chori.ufdr JSON and store in MongoDB
This bypasses the upload endpoint to directly test parsing + storage
"""
import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
import sys

# Your JSON data
json_data = {
  "device_info": {
    "manufacturer": "TestPhoneCo",
    "model": "TestPhone Pro",
    "os": "Android 12",
    "serial": "ROBBERY-TEST-001"
  },
  "extraction_info": {
    "tool": "FakeCellebriteSimulator",
    "version": "1.0",
    "extracted_on": "2025-10-01T14:02:49.115364Z"
  },
  "contacts": [
    {
      "id": "s1",
      "name": "Alpha",
      "number": "+15550001001",
      "email": None,
      "role": "Suspect"
    },
    {
      "id": "s2",
      "name": "Beta",
      "number": "+15550001002",
      "email": None,
      "role": "Suspect"
    },
    {
      "id": "s3",
      "name": "Planner",
      "number": "+15550001003",
      "email": None,
      "role": "Organizer"
    },
    {
      "id": "v1",
      "name": "Shop Owner",
      "number": "+15551234567",
      "email": None,
      "role": "Victim"
    }
  ],
  "calls": [
    {
      "id": "c1",
      "from": "+15550001003",
      "to": None,
      "datetime": "2025-09-24T18:00:00Z",
      "duration": "45",
      "type": "outgoing"
    },
    {
      "id": "c2",
      "from": "+15550001002",
      "to": None,
      "datetime": "2025-09-24T18:45:00Z",
      "duration": "30",
      "type": "outgoing"
    },
    {
      "id": "c3",
      "from": "+15550001001",
      "to": None,
      "datetime": "2025-09-25T20:10:00Z",
      "duration": "60",
      "type": "outgoing"
    },
    {
      "id": "c4",
      "from": "+15551234567",
      "to": None,
      "datetime": "2025-09-25T20:40:00Z",
      "duration": "0",
      "type": "missed"
    }
  ],
  "messages": [
    {
      "id": "m1",
      "from": "+15550001003",
      "to": "+15550001001",
      "timestamp": "2025-09-24T18:30:00Z",
      "body": "Blue van at the dock. Move at 02:00. —P"
    },
    {
      "id": "m2",
      "from": "+15550001002",
      "to": "+15550001001",
      "timestamp": "2025-09-24T19:05:00Z",
      "body": "Got it. Bring gloves. Beta will have the masks."
    },
    {
      "id": "m3",
      "from": "+15550001001",
      "to": "+15550001003",
      "timestamp": "2025-09-25T01:45:00Z",
      "body": "On my way. Park two blocks away."
    }
  ],
  "apps": [
    {
      "app": "WhatsApp",
      "groups": [
        {
          "id": "g1",
          "name": "Night Ops",
          "participants": [
            "+15550001001",
            "+15550001002",
            "+15550001003"
          ],
          "messages": [
            {
              "id": "w1",
              "from": "+15550001003",
              "date": "2025-09-24T17:00:00Z",
              "type": "text",
              "body": "Plan: meet at the alley behind the warehouse. Codeword: 'Midnight Snack'."
            },
            {
              "id": "w2",
              "from": "+15550001002",
              "date": "2025-09-24T17:05:30Z",
              "type": "text",
              "body": "I have the van. Will be at Dock 7."
            },
            {
              "id": "w3",
              "from": "+15550001001",
              "date": "2025-09-25T01:50:10Z",
              "type": "text",
              "body": "All set. Watch for the trolley lights."
            },
            {
              "id": "w4",
              "from": "+15550001003",
              "date": "2025-09-25T02:05:00Z",
              "type": "text",
              "body": "Execute. Good luck."
            }
          ]
        }
      ]
    }
  ],
  "case_id": "CASE-ROB-2025-09",
  "case_theme": "Organized robbery - synthetic dataset",
  "files": [
    "Files/photos/location1.jpg",
    "Files/photos/location2.jpg",
    "Files/audio/call1.wav",
    "Files/audio/call1_transcript.txt"
  ]
}

async def main():
    # Import parser
    sys.path.insert(0, '.')
    import forensic_parser
    
    print("="*60)
    print("MANUAL PARSING AND STORAGE TEST")
    print("="*60)
    
    # Parse the data
    print("\n1. Parsing JSON data...")
    forensic_data = forensic_parser.parse_all_forensic_data(json_data)
    
    print(f"\n2. Parsing Results:")
    print(f"   - Messenger Messages: {len(forensic_data['messenger_messages'])}")
    print(f"   - Messenger Calls: {len(forensic_data['messenger_calls'])}")
    print(f"   - Messenger Accounts: {len(forensic_data['messenger_accounts'])}")
    print(f"   - Call Logs: {len(forensic_data['call_logs'])}")
    print(f"   - Find My Locations: {len(forensic_data['find_my_locations'])}")
    
    if forensic_data['messenger_messages']:
        print(f"\n3. Sample Messages:")
        for i, msg in enumerate(forensic_data['messenger_messages'][:3], 1):
            print(f"   Message {i}: {msg['sender']} → {msg['receiver']}")
            print(f"              {msg['content'][:60]}...")
    
    if forensic_data['call_logs']:
        print(f"\n4. Sample Call Logs:")
        for i, call in enumerate(forensic_data['call_logs'][:3], 1):
            print(f"   Call {i}: {call['contact_name']} ({call['phone_number']})")
            print(f"            Type: {call['call_type']}, Duration: {call['duration_seconds']}s")
    
    # Now store in MongoDB - UPDATED TO NEW SESSION
    session_id = 'case_1760170408329_1760170408834'
    case_id = '5c9b9e62-2f78-474e-b2df-d760cb8381c2'  # MongoDB case_id from file_metadata
    
    print(f"\n5. Storing in MongoDB...")
    print(f"   Session ID: {session_id}")
    print(f"   Case ID: {case_id}")
    
    client = AsyncIOMotorClient('mongodb://localhost:27017/')
    db = client.ufdr_investigation
    
    # Store messages
    if forensic_data['messenger_messages']:
        messages_to_store = []
        for msg in forensic_data['messenger_messages']:
            doc = {**msg, 'session_id': session_id, 'case_id': case_id}
            messages_to_store.append(doc)
        
        result = await db.messenger_messages.insert_many(messages_to_store)
        print(f"   ✅ Stored {len(result.inserted_ids)} messages")
    
    # Store call logs
    if forensic_data['call_logs']:
        calls_to_store = []
        for call in forensic_data['call_logs']:
            doc = {**call, 'session_id': session_id, 'case_id': case_id}
            calls_to_store.append(doc)
        
        result = await db.call_logs.insert_many(calls_to_store)
        print(f"   ✅ Stored {len(result.inserted_ids)} call logs")
    
    # Verify
    print(f"\n6. Verification:")
    msg_count = await db.messenger_messages.count_documents({'session_id': session_id})
    call_count = await db.call_logs.count_documents({'session_id': session_id})
    print(f"   Messages in DB: {msg_count}")
    print(f"   Call Logs in DB: {call_count}")
    
    print(f"\n✅ SUCCESS! Data is now in MongoDB.")
    print(f"\nYou can now refresh your UI and the data should appear!")
    print(f"URL: http://localhost:3000/cases/{case_id}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
