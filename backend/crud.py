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
