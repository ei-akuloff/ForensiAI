import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_data():
    client = AsyncIOMotorClient('mongodb://localhost:27017/')
    db = client.ufdr_investigation
    
    session_id = 'case_1760170408329_1760170408834'
    
    print(f"\nChecking data for session_id: {session_id}\n")
    
    # Count messages
    msg_count = await db.messenger_messages.count_documents({'session_id': session_id})
    print(f"Messenger Messages: {msg_count}")
    
    # Count calls
    call_count = await db.call_logs.count_documents({'session_id': session_id})
    print(f"Call Logs: {call_count}")
    
    # Show sample message if exists
    if msg_count > 0:
        sample_msg = await db.messenger_messages.find_one({'session_id': session_id})
        print(f"\nSample Message:")
        print(f"  Sender: {sample_msg.get('sender')}")
        print(f"  Content: {sample_msg.get('content', '')[:50]}...")
        print(f"  Timestamp: {sample_msg.get('timestamp')}")
    
    # Show sample call if exists
    if call_count > 0:
        sample_call = await db.call_logs.find_one({'session_id': session_id})
        print(f"\nSample Call:")
        print(f"  Phone: {sample_call.get('phone_number')}")
        print(f"  Contact: {sample_call.get('contact_name')}")
        print(f"  Type: {sample_call.get('call_type')}")
        print(f"  Timestamp: {sample_call.get('timestamp')}")
    
    if msg_count == 0 and call_count == 0:
        print("\n⚠️ NO DATA FOUND! Checking all session_ids in DB...")
        all_sessions = await db.messenger_messages.distinct('session_id')
        print(f"Available session_ids: {all_sessions}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_data())
