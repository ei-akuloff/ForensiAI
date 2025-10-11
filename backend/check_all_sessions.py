import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_all_sessions():
    client = AsyncIOMotorClient('mongodb://localhost:27017/')
    db = client.ufdr_investigation
    
    print("\n" + "="*60)
    print("ALL SESSION IDs IN DATABASE")
    print("="*60)
    
    # Get all session_ids from messenger_messages
    msg_sessions = await db.messenger_messages.distinct('session_id')
    print(f"\nSession IDs with messenger messages:")
    for session_id in msg_sessions:
        count = await db.messenger_messages.count_documents({'session_id': session_id})
        print(f"  - {session_id}: {count} messages")
    
    # Get all session_ids from call_logs
    call_sessions = await db.call_logs.distinct('session_id')
    print(f"\nSession IDs with call logs:")
    for session_id in call_sessions:
        count = await db.call_logs.count_documents({'session_id': session_id})
        print(f"  - {session_id}: {count} calls")
    
    # Check the new session_id
    new_session = 'case_1760170408329_1760170408834'
    print(f"\n" + "="*60)
    print(f"CHECKING NEW SESSION: {new_session}")
    print("="*60)
    
    msg_count = await db.messenger_messages.count_documents({'session_id': new_session})
    call_count = await db.call_logs.count_documents({'session_id': new_session})
    
    print(f"Messages: {msg_count}")
    print(f"Call Logs: {call_count}")
    
    if msg_count == 0 and call_count == 0:
        print("\n⚠️ NO DATA FOR THIS SESSION!")
        print("This means the upload/parsing failed for this case.")
        print("\nPossible reasons:")
        print("1. Backend wasn't running during upload")
        print("2. Parsing threw an exception")
        print("3. File upload didn't complete")
    
    # Check if there's a file_metadata entry
    file_meta = await db.file_metadata.find_one({'session_id': new_session})
    if file_meta:
        print(f"\nFile metadata exists:")
        print(f"  Filename: {file_meta.get('filename')}")
        print(f"  File type: {file_meta.get('file_type')}")
        print(f"  Processed: {file_meta.get('processed')}")
        print(f"  Case ID: {file_meta.get('case_id')}")
    else:
        print("\n⚠️ No file_metadata entry - upload may not have completed!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_all_sessions())
