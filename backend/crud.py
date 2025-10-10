"""
CRUD Operations for MongoDB Collections
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
import uuid

from models import (
    User, Case, Session, AnalysisResult, 
    Relationship, AuditLog, FileMetadata,
    CaseStatus, UserRole
)


def serialize_doc(doc: Dict) -> Dict:
    """Convert MongoDB document to JSON-serializable format"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ===== USER CRUD OPERATIONS =====

async def create_user(db, user: User) -> Dict:
    """Create a new user"""
    user_dict = user.dict(exclude={"user_id"})
    user_dict["user_id"] = str(uuid.uuid4())
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    return serialize_doc(user_dict)


async def get_user_by_email(db, email: str) -> Optional[Dict]:
    """Get user by email"""
    user = await db.users.find_one({"email": email})
    return serialize_doc(user) if user else None


async def get_user_by_username(db, username: str) -> Optional[Dict]:
    """Get user by username"""
    user = await db.users.find_one({"username": username})
    return serialize_doc(user) if user else None


async def get_user_by_id(db, user_id: str) -> Optional[Dict]:
    """Get user by ID"""
    user = await db.users.find_one({"user_id": user_id})
    return serialize_doc(user) if user else None


async def update_user_last_login(db, user_id: str):
    """Update user's last login timestamp"""
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"last_login": datetime.utcnow()}}
    )


# ===== CASE CRUD OPERATIONS =====

async def create_case(db, case: Case) -> Dict:
    """Create a new case"""
    case_dict = case.dict()
    result = await db.cases.insert_one(case_dict)
    case_dict["_id"] = str(result.inserted_id)
    return serialize_doc(case_dict)


async def get_case_by_id(db, case_id: str) -> Optional[Dict]:
    """Get case by ID"""
    case = await db.cases.find_one({"case_id": case_id})
    return serialize_doc(case) if case else None


async def get_cases_by_user(db, user_id: str) -> List[Dict]:
    """Get all cases assigned to or created by a user"""
    cursor = db.cases.find({
        "$or": [
            {"assigned_to": user_id},
            {"created_by": user_id}
        ]
    }).sort("created_at", -1)
    cases = await cursor.to_list(length=100)
    return [serialize_doc(case) for case in cases]


async def get_all_cases(db, status: Optional[CaseStatus] = None, limit: int = 50) -> List[Dict]:
    """Get all cases with optional status filter"""
    query = {"status": status} if status else {}
    cursor = db.cases.find(query).sort("created_at", -1).limit(limit)
    cases = await cursor.to_list(length=limit)
    return [serialize_doc(case) for case in cases]


async def update_case(db, case_id: str, updates: Dict) -> bool:
    """Update case information"""
    updates["updated_at"] = datetime.utcnow()
    result = await db.cases.update_one(
        {"case_id": case_id},
        {"$set": updates}
    )
    return result.modified_count > 0


async def delete_case(db, case_id: str) -> bool:
    """Delete a case (soft delete by marking as archived)"""
    result = await db.cases.update_one(
        {"case_id": case_id},
        {"$set": {"status": CaseStatus.ARCHIVED, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0


# ===== SESSION CRUD OPERATIONS =====

async def create_session(db, session: Session) -> Dict:
    """Create a new analysis session"""
    session_dict = session.dict()
    result = await db.sessions.insert_one(session_dict)
    session_dict["_id"] = str(result.inserted_id)
    return serialize_doc(session_dict)


async def get_session_by_id(db, session_id: str) -> Optional[Dict]:
    """Get session by ID"""
    session = await db.sessions.find_one({"session_id": session_id})
    return serialize_doc(session) if session else None


async def get_sessions_by_case(db, case_id: str) -> List[Dict]:
    """Get all sessions for a case"""
    cursor = db.sessions.find({"case_id": case_id}).sort("created_at", -1)
    sessions = await cursor.to_list(length=100)
    return [serialize_doc(session) for session in sessions]


async def update_session(db, session_id: str, updates: Dict) -> bool:
    """Update session information"""
    updates["updated_at"] = datetime.utcnow()
    result = await db.sessions.update_one(
        {"session_id": session_id},
        {"$set": updates}
    )
    return result.modified_count > 0


async def add_file_to_session(db, session_id: str, file_info: Dict) -> bool:
    """Add uploaded file information to session"""
    result = await db.sessions.update_one(
        {"session_id": session_id},
        {
            "$push": {"files_uploaded": file_info},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return result.modified_count > 0


# ===== ANALYSIS RESULT CRUD OPERATIONS =====

async def create_analysis_result(db, analysis: AnalysisResult) -> Dict:
    """Create a new analysis result"""
    analysis_dict = analysis.dict(exclude={"analysis_id"})
    analysis_dict["analysis_id"] = str(uuid.uuid4())
    result = await db.analysis_results.insert_one(analysis_dict)
    analysis_dict["_id"] = str(result.inserted_id)
    return serialize_doc(analysis_dict)


async def get_analysis_results_by_session(db, session_id: str) -> List[Dict]:
    """Get all analysis results for a session"""
    cursor = db.analysis_results.find({"session_id": session_id}).sort("created_at", -1)
    results = await cursor.to_list(length=100)
    return [serialize_doc(result) for result in results]


async def get_analysis_results_by_case(db, case_id: str, analysis_type: Optional[str] = None) -> List[Dict]:
    """Get all analysis results for a case"""
    query = {"case_id": case_id}
    if analysis_type:
        query["analysis_type"] = analysis_type
    cursor = db.analysis_results.find(query).sort("created_at", -1)
    results = await cursor.to_list(length=100)
    return [serialize_doc(result) for result in results]


# ===== RELATIONSHIP CRUD OPERATIONS =====

async def create_relationship_analysis(db, relationship: Relationship) -> Dict:
    """Create a new relationship analysis"""
    relationship_dict = relationship.dict(exclude={"relationship_id"})
    relationship_dict["relationship_id"] = str(uuid.uuid4())
    result = await db.relationships.insert_one(relationship_dict)
    relationship_dict["_id"] = str(result.inserted_id)
    return serialize_doc(relationship_dict)


async def get_relationships_by_session(db, session_id: str) -> Optional[Dict]:
    """Get relationship analysis for a session"""
    relationship = await db.relationships.find_one({"session_id": session_id})
    return serialize_doc(relationship) if relationship else None


async def get_relationships_by_case(db, case_id: str) -> List[Dict]:
    """Get all relationship analyses for a case"""
    cursor = db.relationships.find({"case_id": case_id}).sort("created_at", -1)
    relationships = await cursor.to_list(length=100)
    return [serialize_doc(rel) for rel in relationships]


# ===== AUDIT LOG CRUD OPERATIONS =====

async def create_audit_log(db, audit: AuditLog) -> Dict:
    """Create a new audit log entry"""
    audit_dict = audit.dict(exclude={"log_id"})
    audit_dict["log_id"] = str(uuid.uuid4())
    result = await db.audit_logs.insert_one(audit_dict)
    audit_dict["_id"] = str(result.inserted_id)
    return serialize_doc(audit_dict)


async def get_audit_logs(db, user_id: Optional[str] = None, resource_id: Optional[str] = None, limit: int = 100) -> List[Dict]:
    """Get audit logs with optional filters"""
    query = {}
    if user_id:
        query["user_id"] = user_id
    if resource_id:
        query["resource_id"] = resource_id
    
    cursor = db.audit_logs.find(query).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    return [serialize_doc(log) for log in logs]


# ===== FILE METADATA CRUD OPERATIONS =====

async def create_file_metadata(db, file_meta: FileMetadata) -> Dict:
    """Create file metadata record"""
    file_dict = file_meta.dict(exclude={"file_id"})
    file_dict["file_id"] = str(uuid.uuid4())
    result = await db.file_metadata.insert_one(file_dict)
    file_dict["_id"] = str(result.inserted_id)
    return serialize_doc(file_dict)


async def get_files_by_session(db, session_id: str) -> List[Dict]:
    """Get all files for a session"""
    cursor = db.file_metadata.find({"session_id": session_id}).sort("upload_timestamp", -1)
    files = await cursor.to_list(length=100)
    return [serialize_doc(file) for file in files]


async def get_files_by_case(db, case_id: str) -> List[Dict]:
    """Get all files for a case"""
    cursor = db.file_metadata.find({"case_id": case_id}).sort("upload_timestamp", -1)
    files = await cursor.to_list(length=100)
    return [serialize_doc(file) for file in files]


async def update_file_processed_status(db, file_id: str, chunks_count: int) -> bool:
    """Update file processed status"""
    result = await db.file_metadata.update_one(
        {"file_id": file_id},
        {"$set": {"processed": True, "chunks_count": chunks_count}}
    )
    return result.modified_count > 0


# ===== FORENSIC DATA CRUD OPERATIONS =====

async def create_messenger_message(db, message: Dict) -> Dict:
    """Create a messenger message record"""
    message["message_id"] = str(uuid.uuid4())
    if not message.get("created_at"):
        message["created_at"] = datetime.utcnow()
    result = await db.messenger_messages.insert_one(message)
    message["_id"] = str(result.inserted_id)
    return serialize_doc(message)


async def bulk_create_messenger_messages(db, messages: List[Dict]) -> int:
    """Bulk create messenger messages"""
    if not messages:
        return 0
    for msg in messages:
        msg["message_id"] = str(uuid.uuid4())
        if not msg.get("created_at"):
            msg["created_at"] = datetime.utcnow()
    result = await db.messenger_messages.insert_many(messages)
    return len(result.inserted_ids)


async def get_messenger_messages_by_session(db, session_id: str, limit: int = 1000) -> List[Dict]:
    """Get messenger messages for a session"""
    cursor = db.messenger_messages.find({"session_id": session_id}).sort("timestamp", -1).limit(limit)
    messages = await cursor.to_list(length=limit)
    return [serialize_doc(msg) for msg in messages]


async def get_messenger_messages_by_case(db, case_id: str, app_name: Optional[str] = None, limit: int = 1000) -> List[Dict]:
    """Get messenger messages for a case"""
    query = {"case_id": case_id}
    if app_name:
        query["app_name"] = app_name
    cursor = db.messenger_messages.find(query).sort("timestamp", -1).limit(limit)
    messages = await cursor.to_list(length=limit)
    return [serialize_doc(msg) for msg in messages]


async def create_messenger_call(db, call: Dict) -> Dict:
    """Create a messenger call record"""
    call["call_id"] = str(uuid.uuid4())
    if not call.get("created_at"):
        call["created_at"] = datetime.utcnow()
    result = await db.messenger_calls.insert_one(call)
    call["_id"] = str(result.inserted_id)
    return serialize_doc(call)


async def bulk_create_messenger_calls(db, calls: List[Dict]) -> int:
    """Bulk create messenger calls"""
    if not calls:
        return 0
    for call in calls:
        call["call_id"] = str(uuid.uuid4())
        if not call.get("created_at"):
            call["created_at"] = datetime.utcnow()
    result = await db.messenger_calls.insert_many(calls)
    return len(result.inserted_ids)


async def get_messenger_calls_by_session(db, session_id: str) -> List[Dict]:
    """Get messenger calls for a session"""
    cursor = db.messenger_calls.find({"session_id": session_id}).sort("start_time", -1)
    calls = await cursor.to_list(length=500)
    return [serialize_doc(call) for call in calls]


async def get_messenger_calls_by_case(db, case_id: str) -> List[Dict]:
    """Get messenger calls for a case"""
    cursor = db.messenger_calls.find({"case_id": case_id}).sort("start_time", -1)
    calls = await cursor.to_list(length=500)
    return [serialize_doc(call) for call in calls]


async def create_messenger_account(db, account: Dict) -> Dict:
    """Create a messenger account record"""
    account["account_id"] = str(uuid.uuid4())
    if not account.get("created_at"):
        account["created_at"] = datetime.utcnow()
    result = await db.messenger_accounts.insert_one(account)
    account["_id"] = str(result.inserted_id)
    return serialize_doc(account)


async def bulk_create_messenger_accounts(db, accounts: List[Dict]) -> int:
    """Bulk create messenger accounts"""
    if not accounts:
        return 0
    for account in accounts:
        account["account_id"] = str(uuid.uuid4())
        if not account.get("created_at"):
            account["created_at"] = datetime.utcnow()
    result = await db.messenger_accounts.insert_many(accounts)
    return len(result.inserted_ids)


async def get_messenger_accounts_by_session(db, session_id: str) -> List[Dict]:
    """Get messenger accounts for a session"""
    cursor = db.messenger_accounts.find({"session_id": session_id})
    accounts = await cursor.to_list(length=100)
    return [serialize_doc(account) for account in accounts]


async def get_messenger_accounts_by_case(db, case_id: str) -> List[Dict]:
    """Get messenger accounts for a case"""
    cursor = db.messenger_accounts.find({"case_id": case_id})
    accounts = await cursor.to_list(length=100)
    return [serialize_doc(account) for account in accounts]


async def create_call_log(db, call_log: Dict) -> Dict:
    """Create a call log record"""
    call_log["call_log_id"] = str(uuid.uuid4())
    if not call_log.get("created_at"):
        call_log["created_at"] = datetime.utcnow()
    result = await db.call_logs.insert_one(call_log)
    call_log["_id"] = str(result.inserted_id)
    return serialize_doc(call_log)


async def bulk_create_call_logs(db, call_logs: List[Dict]) -> int:
    """Bulk create call logs"""
    if not call_logs:
        return 0
    for log in call_logs:
        log["call_log_id"] = str(uuid.uuid4())
        if not log.get("created_at"):
            log["created_at"] = datetime.utcnow()
    result = await db.call_logs.insert_many(call_logs)
    return len(result.inserted_ids)


async def get_call_logs_by_session(db, session_id: str, limit: int = 1000) -> List[Dict]:
    """Get call logs for a session"""
    cursor = db.call_logs.find({"session_id": session_id}).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    return [serialize_doc(log) for log in logs]


async def get_call_logs_by_case(db, case_id: str, limit: int = 1000) -> List[Dict]:
    """Get call logs for a case"""
    cursor = db.call_logs.find({"case_id": case_id}).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    return [serialize_doc(log) for log in logs]


async def create_find_my_location(db, location: Dict) -> Dict:
    """Create a Find My location record"""
    location["location_id"] = str(uuid.uuid4())
    if not location.get("created_at"):
        location["created_at"] = datetime.utcnow()
    result = await db.find_my_locations.insert_one(location)
    location["_id"] = str(result.inserted_id)
    return serialize_doc(location)


async def bulk_create_find_my_locations(db, locations: List[Dict]) -> int:
    """Bulk create Find My locations"""
    if not locations:
        return 0
    for loc in locations:
        loc["location_id"] = str(uuid.uuid4())
        if not loc.get("created_at"):
            loc["created_at"] = datetime.utcnow()
    result = await db.find_my_locations.insert_many(locations)
    return len(result.inserted_ids)


async def get_find_my_locations_by_session(db, session_id: str) -> List[Dict]:
    """Get Find My locations for a session"""
    cursor = db.find_my_locations.find({"session_id": session_id}).sort("timestamp", -1)
    locations = await cursor.to_list(length=1000)
    return [serialize_doc(loc) for loc in locations]


async def get_find_my_locations_by_case(db, case_id: str) -> List[Dict]:
    """Get Find My locations for a case"""
    cursor = db.find_my_locations.find({"case_id": case_id}).sort("timestamp", -1)
    locations = await cursor.to_list(length=1000)
    return [serialize_doc(loc) for loc in locations]


async def create_forensic_summary(db, summary: Dict) -> Dict:
    """Create a forensic summary record"""
    summary["summary_id"] = str(uuid.uuid4())
    if not summary.get("created_at"):
        summary["created_at"] = datetime.utcnow()
    result = await db.forensic_summaries.insert_one(summary)
    summary["_id"] = str(result.inserted_id)
    return serialize_doc(summary)


async def get_forensic_summary_by_session(db, session_id: str) -> Optional[Dict]:
    """Get forensic summary for a session"""
    summary = await db.forensic_summaries.find_one({"session_id": session_id})
    return serialize_doc(summary) if summary else None


async def get_forensic_summary_by_case(db, case_id: str) -> List[Dict]:
    """Get forensic summaries for a case"""
    cursor = db.forensic_summaries.find({"case_id": case_id}).sort("created_at", -1)
    summaries = await cursor.to_list(length=100)
    return [serialize_doc(summary) for summary in summaries]
