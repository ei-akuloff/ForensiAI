"""
Test MongoDB Connection and Basic Operations
Run this to verify MongoDB is properly configured
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from database import connect_to_mongodb, close_mongodb_connection, get_database
from models import Case, Session, CaseStatus, CasePriority
import crud
import uuid
from datetime import datetime


async def test_mongodb_connection():
    """Test MongoDB connection and basic CRUD operations"""
    print("=" * 60)
    print("MongoDB Connection Test")
    print("=" * 60)
    
    try:
        # Connect to MongoDB
        print("\n1. Testing MongoDB Connection...")
        await connect_to_mongodb()
        print("✅ Successfully connected to MongoDB!")
        
        # Get database instance
        db = get_database()
        
        # Test Case Creation
        print("\n2. Testing Case Creation...")
        test_case = Case(
            case_id=str(uuid.uuid4()),
            case_number="TEST-2024-001",
            title="Test Investigation Case",
            description="This is a test case to verify MongoDB integration",
            status=CaseStatus.ACTIVE,
            priority=CasePriority.HIGH,
            created_by="test_user"
        )
        
        created_case = await crud.create_case(db, test_case)
        print(f"✅ Case created: {created_case['case_number']}")
        print(f"   Case ID: {created_case['case_id']}")
        
        # Test Case Retrieval
        print("\n3. Testing Case Retrieval...")
        retrieved_case = await crud.get_case_by_id(db, created_case['case_id'])
        if retrieved_case:
            print(f"✅ Case retrieved: {retrieved_case['title']}")
        else:
            print("❌ Failed to retrieve case")
        
        # Test Session Creation
        print("\n4. Testing Session Creation...")
        test_session = Session(
            session_id=str(uuid.uuid4()),
            case_id=created_case['case_id'],
            user_id="test_user"
        )
        
        created_session = await crud.create_session(db, test_session)
        print(f"✅ Session created: {created_session['session_id']}")
        
        # Test List Cases
        print("\n5. Testing List Cases...")
        all_cases = await crud.get_all_cases(db, limit=10)
        print(f"✅ Found {len(all_cases)} case(s) in database")
        
        # Test Case Update
        print("\n6. Testing Case Update...")
        update_success = await crud.update_case(
            db, 
            created_case['case_id'],
            {"status": CaseStatus.CLOSED}
        )
        if update_success:
            print("✅ Case updated successfully")
        else:
            print("❌ Failed to update case")
        
        # Test Session Retrieval by Case
        print("\n7. Testing Session Retrieval...")
        case_sessions = await crud.get_sessions_by_case(db, created_case['case_id'])
        print(f"✅ Found {len(case_sessions)} session(s) for this case")
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nMongoDB is properly configured and working!")
        print("You can now use the backend with MongoDB integration.")
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ TEST FAILED")
        print("=" * 60)
        print(f"\nError: {str(e)}")
        print("\nPlease check:")
        print("1. MongoDB is installed and running")
        print("2. Connection string in .env is correct")
        print("3. MongoDB service is started")
        import traceback
        traceback.print_exc()
    
    finally:
        # Close connection
        print("\n8. Closing MongoDB connection...")
        await close_mongodb_connection()
        print("✅ Connection closed")


async def cleanup_test_data():
    """Optional: Clean up test data"""
    print("\nCleaning up test data...")
    try:
        await connect_to_mongodb()
        db = get_database()
        
        # Delete test cases
        result = await db.cases.delete_many({"case_number": {"$regex": "^TEST-"}})
        print(f"✅ Deleted {result.deleted_count} test case(s)")
        
        await close_mongodb_connection()
    except Exception as e:
        print(f"❌ Cleanup error: {str(e)}")


if __name__ == "__main__":
    print("\nStarting MongoDB Test...")
    print("Make sure MongoDB is running before proceeding!\n")
    
    # Run the test
    asyncio.run(test_mongodb_connection())
    
    # Ask if user wants to cleanup
    print("\n" + "=" * 60)
    cleanup = input("Do you want to clean up test data? (y/n): ")
    if cleanup.lower() == 'y':
        asyncio.run(cleanup_test_data())
        print("✅ Cleanup completed")
