"""
MongoDB Data Models for UFDR Investigation System
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CaseStatus(str, Enum):
    """Case status enumeration"""
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"
    PENDING = "pending"


class CasePriority(str, Enum):
    """Case priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    INVESTIGATOR = "investigator"
    ANALYST = "analyst"
    VIEWER = "viewer"


class User(BaseModel):
    """User model"""
    user_id: Optional[str] = None
    username: str
    email: EmailStr
    password_hash: str
    full_name: str
    role: UserRole = UserRole.VIEWER
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True


class Case(BaseModel):
    """Case model"""
    case_id: str
    case_number: str
    title: str
    description: Optional[str] = None
    status: CaseStatus = CaseStatus.ACTIVE
    priority: CasePriority = CasePriority.MEDIUM
    assigned_to: Optional[str] = None  # User ID
    created_by: str  # User ID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []
    metadata: Dict[str, Any] = {}


class Session(BaseModel):
    """Analysis session model"""
    session_id: str
    case_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    files_uploaded: List[Dict[str, Any]] = []
    status: str = "active"
    metadata: Dict[str, Any] = {}


class AnalysisResult(BaseModel):
    """Analysis result model"""
    analysis_id: Optional[str] = None
    session_id: str
    case_id: str
    analysis_type: str  # "relationship", "timeline", "location", "communication"
    result_data: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}


class Relationship(BaseModel):
    """Relationship analysis model"""
    relationship_id: Optional[str] = None
    session_id: str
    case_id: str
    people: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]
    summary: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}


class AuditLog(BaseModel):
    """Audit log model for tracking actions"""
    log_id: Optional[str] = None
    user_id: str
    action: str
    resource_type: str  # "case", "session", "file", etc.
    resource_id: str
    details: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None


class FileMetadata(BaseModel):
    """File metadata model"""
    file_id: Optional[str] = None
    session_id: str
    case_id: str
    filename: str
    file_type: str  # "ufdr", "json", "encrypted_ufdr"
    file_size: int
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)
    processed: bool = False
    chunks_count: Optional[int] = None
    metadata: Dict[str, Any] = {}
