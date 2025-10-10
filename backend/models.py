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


# ===== NEW FORENSIC DATA MODELS =====

class MessageType(str, Enum):
    """Message type enumeration"""
    SENT = "sent"
    RECEIVED = "received"
    DELETED = "deleted"


class CallType(str, Enum):
    """Call type enumeration"""
    INCOMING = "incoming"
    OUTGOING = "outgoing"
    MISSED = "missed"
    REJECTED = "rejected"
    BLOCKED = "blocked"


class MessengerMessage(BaseModel):
    """Messenger message model (Facebook Messenger, WhatsApp, etc.)"""
    message_id: Optional[str] = None
    session_id: str
    case_id: str
    app_name: str  # "messenger", "whatsapp", "telegram", etc.
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    message_type: MessageType
    sender: str
    receiver: str
    content: Optional[str] = None
    timestamp: datetime
    is_encrypted: bool = False
    encryption_type: Optional[str] = None
    has_attachments: bool = False
    attachment_count: int = 0
    attachment_types: List[str] = []
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MessengerCall(BaseModel):
    """Messenger call model (voice/video calls through apps)"""
    call_id: Optional[str] = None
    session_id: str
    case_id: str
    app_name: str  # "messenger", "whatsapp", "skype", etc.
    call_type: CallType
    caller: str
    receiver: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    is_video: bool = False
    call_quality: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MessengerAccount(BaseModel):
    """Messenger account model (encrypted or recovered accounts)"""
    account_id: Optional[str] = None
    session_id: str
    case_id: str
    app_name: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    profile_picture_url: Optional[str] = None
    account_created: Optional[datetime] = None
    last_active: Optional[datetime] = None
    is_encrypted: bool = False
    encryption_status: str = "unknown"  # "encrypted", "decrypted", "partially_decrypted"
    message_count: int = 0
    call_count: int = 0
    contacts: List[str] = []
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CallLog(BaseModel):
    """Device call log model (native phone calls)"""
    call_log_id: Optional[str] = None
    session_id: str
    case_id: str
    call_type: CallType
    phone_number: str
    contact_name: Optional[str] = None
    timestamp: datetime
    duration_seconds: Optional[int] = None
    sim_card: Optional[str] = None
    network_type: Optional[str] = None  # "GSM", "LTE", "5G", etc.
    cell_tower_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FindMyLocation(BaseModel):
    """iOS Find My location data model"""
    location_id: Optional[str] = None
    session_id: str
    case_id: str
    device_name: str
    device_model: Optional[str] = None
    device_id: str
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    accuracy: Optional[float] = None  # meters
    timestamp: datetime
    battery_level: Optional[int] = None  # percentage
    is_charging: Optional[bool] = None
    location_source: str  # "GPS", "WiFi", "Cellular", "Bluetooth"
    speed: Optional[float] = None  # meters per second
    heading: Optional[float] = None  # degrees
    address: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ForensicSummary(BaseModel):
    """Summary of all forensic data extracted from a session"""
    summary_id: Optional[str] = None
    session_id: str
    case_id: str
    messenger_accounts: int = 0
    messenger_messages: int = 0
    messenger_calls: int = 0
    call_logs: int = 0
    find_my_locations: int = 0
    earliest_activity: Optional[datetime] = None
    latest_activity: Optional[datetime] = None
    top_contacts: List[Dict[str, Any]] = []
    most_active_apps: List[Dict[str, Any]] = []
    location_clusters: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
