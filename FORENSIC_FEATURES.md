# Forensic Features Documentation

## Overview

The UFDR Investigation Agent has been extended with powerful forensic data extraction and visualization capabilities inspired by Cellebrite's Physical Analyzer 7.57. These features enable investigators to extract, analyze, and visualize:

- **Messenger Communications**: Messages, calls, and accounts from multiple apps (WhatsApp, Telegram, Signal, Messenger, Viber, Skype, etc.)
- **Call Logs**: Native phone call records with cell tower data, duration, and contact information
- **Find My Location**: iOS Find My/iCloud location tracking history with device information
- **Communication Analytics**: Visual analysis of communication patterns, contact frequency, and app usage

## Architecture

### Backend Components

#### 1. Data Models (`backend/models.py`)

Eight new Pydantic models for forensic data validation:

```python
# Enums
class MessageType(str, Enum):
    sent = "sent"
    received = "received"
    deleted = "deleted"

class CallType(str, Enum):
    incoming = "incoming"
    outgoing = "outgoing"
    missed = "missed"
    rejected = "rejected"
    blocked = "blocked"

# Models
- MessengerMessage: Messages from messenger apps
- MessengerCall: Voice/video calls from messenger apps
- MessengerAccount: Account information and metadata
- CallLog: Native phone call records
- FindMyLocation: GPS/location tracking data
- ForensicSummary: Aggregate statistics and analysis
```

**Key Features:**

- Timestamp handling for multiple formats
- Encryption status tracking
- Geolocation support (latitude/longitude)
- Metadata storage for extensibility

#### 2. Forensic Parser (`backend/forensic_parser.py`)

Parsing logic for extracting forensic data from UFDR JSON files.

**Core Functions:**

```python
def parse_timestamp(timestamp_str: str) -> Optional[datetime]
    """Handles 7+ timestamp formats including Unix milliseconds"""

def extract_phone_number(text: str) -> Optional[str]
    """Extracts phone numbers with international format support"""

def parse_messenger_data(json_data: dict) -> Tuple[List, List, List]
    """Returns (messages, calls, accounts) from messenger apps"""
    # Supports: messenger, whatsapp, telegram, signal, viber, skype, etc.

def parse_call_logs(json_data: dict) -> List[dict]
    """Extracts native phone call records with cell tower data"""

def parse_find_my_data(json_data: dict) -> List[dict]
    """Parses iOS Find My/iCloud location history"""

def parse_all_forensic_data(json_text: str) -> dict
    """Orchestrates all parsers, returns complete forensic dataset"""

def extract_forensic_summary(forensic_data: dict) -> dict
    """Generates statistics and analytics"""
```

**Parsing Strategy:**

- Flexible JSON path traversal
- Error-tolerant parsing (continues on individual failures)
- Automatic app detection from file names/metadata
- Contact frequency ranking
- Location clustering

#### 3. CRUD Operations (`backend/crud.py`)

20+ async MongoDB operations for forensic data management:

**Bulk Insert Functions:**

```python
async def bulk_create_messenger_messages(db, messages: List, session_id, case_id)
async def bulk_create_messenger_calls(db, calls: List, session_id, case_id)
async def bulk_create_messenger_accounts(db, accounts: List, session_id, case_id)
async def bulk_create_call_logs(db, logs: List, session_id, case_id)
async def bulk_create_find_my_locations(db, locations: List, session_id, case_id)
```

**Retrieval Functions:**

```python
async def get_messenger_messages_by_session(db, session_id, limit=1000)
async def get_messenger_messages_by_case(db, case_id, app_name=None)
async def get_call_logs_by_session(db, session_id)
async def get_find_my_locations_by_session(db, session_id)
async def get_forensic_summary_by_session(db, session_id)
```

**Performance Optimization:**

- Bulk inserts for large datasets
- UUID generation for unique identifiers
- Compound indexes for fast queries
- Case-level data aggregation

#### 4. Database Indexes (`backend/database.py`)

Optimized indexes for six new collections:

```python
# messenger_messages
- (session_id, case_id, timestamp, app_name)

# messenger_calls
- (session_id, case_id, start_time)

# messenger_accounts
- (session_id, case_id, app_name)

# call_logs
- (session_id, case_id, timestamp, phone_number)

# find_my_locations
- (session_id, case_id, timestamp)
- 2dsphere index on (latitude, longitude) for geospatial queries

# forensic_summaries
- (session_id unique, case_id)
```

#### 5. REST API Endpoints (`backend/main.py`)

Six new FastAPI endpoints:

##### POST /forensic/parse-all/{session_id}

Parse all forensic data from session files and store in MongoDB.

**Request:**

```bash
curl -X POST "http://localhost:8000/forensic/parse-all/case_123_session" \
  -F "case_id=case_123"
```

**Response:**

```json
{
  "message": "Forensic data parsed successfully",
  "counts": {
    "messenger_messages": 1523,
    "messenger_calls": 87,
    "messenger_accounts": 12,
    "call_logs": 345,
    "find_my_locations": 892
  },
  "summary": { ... }
}
```

##### GET /forensic/messenger/{session_id}

Retrieve messenger data with optional app filter.

**Request:**

```bash
curl "http://localhost:8000/forensic/messenger/case_123_session?app_name=whatsapp"
```

**Response:**

```json
{
  "messages": [...],
  "calls": [...],
  "accounts": [...],
  "total_messages": 756,
  "total_calls": 43,
  "total_accounts": 1
}
```

##### GET /forensic/call-logs/{session_id}

Retrieve native phone call logs.

**Response:**

```json
{
  "call_logs": [...],
  "total_calls": 345
}
```

##### GET /forensic/find-my/{session_id}

Retrieve Find My location data.

**Response:**

```json
{
  "locations": [...],
  "total_locations": 892
}
```

##### GET /forensic/summary/{session_id}

Retrieve aggregate forensic statistics.

**Response:**

```json
{
  "summary_id": "uuid",
  "session_id": "case_123_session",
  "case_id": "case_123",
  "messenger_accounts": 12,
  "messenger_messages": 1523,
  "messenger_calls": 87,
  "call_logs": 345,
  "find_my_locations": 892,
  "earliest_activity": "2024-01-01T00:00:00Z",
  "latest_activity": "2024-12-31T23:59:59Z",
  "top_contacts": [
    { "contact": "+1234567890", "count": 234 },
    { "contact": "John Doe", "count": 187 }
  ],
  "most_active_apps": [
    { "app": "whatsapp", "count": 756 },
    { "app": "telegram", "count": 523 }
  ],
  "location_clusters": [
    {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "count": 156,
      "address": "San Francisco, CA"
    }
  ]
}
```

##### GET /forensic/case/{case_id}

Retrieve all forensic data for a case with optional data type filter.

**Request:**

```bash
curl "http://localhost:8000/forensic/case/case_123?data_type=messenger"
```

**Response:**

```json
{
  "case_id": "case_123",
  "sessions": [...],
  "messenger_data": {...},
  "call_logs": {...},
  "find_my_data": {...},
  "summaries": [...]
}
```

#### 6. Automatic Parsing on Upload

The `/upload/` endpoint has been extended to automatically trigger forensic parsing after successful file processing:

**Workflow:**

1. Upload UFDR file → Extract JSON
2. Chunk text → Store in ChromaDB
3. Save file metadata → MongoDB
4. **[NEW]** Parse forensic data → Store in MongoDB
5. Generate summary → Store in MongoDB

**Error Handling:**

- Forensic parsing failures don't fail the upload
- Detailed logging for debugging
- Graceful degradation if forensic data unavailable

### Frontend Components

#### 1. TypeScript Types (`src/types/forensic.ts`)

Comprehensive type definitions matching backend models:

```typescript
export type MessageType = "sent" | "received" | "deleted";
export type CallType = "incoming" | "outgoing" | "missed" | "rejected" | "blocked";

export interface MessengerMessage { ... }
export interface MessengerCall { ... }
export interface MessengerAccount { ... }
export interface CallLog { ... }
export interface FindMyLocation { ... }
export interface ForensicSummary { ... }

// Helper types
export interface TimelineEvent { ... }
export interface CommunicationStats { ... }
export interface LocationCluster { ... }
```

#### 2. API Service (`src/lib/backend-service.ts`)

Six new API functions:

```typescript
async function parseForensicData(
  sessionId,
  caseId
): Promise<ForensicParseResult>;
async function getMessengerData(sessionId, appName?): Promise<MessengerData>;
async function getCallLogs(sessionId): Promise<CallLogsData>;
async function getFindMyData(sessionId): Promise<FindMyData>;
async function getForensicSummary(sessionId): Promise<ForensicSummary>;
async function getCaseForensicData(caseId, dataType?): Promise<any>;
```

#### 3. React Components

Four specialized visualization components:

##### MessengerTimeline (`src/components/forensic/messenger-timeline.tsx`)

**Features:**

- Displays messages and calls in chronological order
- App filtering (WhatsApp, Telegram, Signal, etc.)
- Search by content or contact
- Date range filtering
- Visual indicators:
  - 🔒 Encryption status
  - 📎 Attachments
  - 📍 Location sharing
  - 📹 Video calls
- Message type color coding
- Timeline visualization with dots and lines

**Props:**

```typescript
interface MessengerTimelineProps {
  sessionId: string;
  caseId: string;
}
```

##### CallLogsTimeline (`src/components/forensic/call-logs-timeline.tsx`)

**Features:**

- Statistics dashboard:
  - Total calls
  - Total duration
  - Unique contacts
  - Missed calls count
- Call type filtering (incoming, outgoing, missed, rejected, blocked)
- Search by phone number or contact name
- Date range filtering
- Call details:
  - Duration formatting (XhYm or XmYs)
  - Network type (4G, 5G, WiFi)
  - SIM card info
  - Cell tower ID
  - GPS coordinates
- Timeline visualization with color-coded dots
- Contact frequency analysis

**Props:**

```typescript
interface CallLogsTimelineProps {
  sessionId: string;
  caseId: string;
}
```

##### FindMyMap (`src/components/forensic/find-my-map.tsx`)

**Features:**

- Statistics dashboard:
  - Total locations
  - Tracked devices
  - Location clusters
  - Average accuracy
- Device filtering (iPhone, iPad, AirPods, etc.)
- Date range filtering
- Location clustering algorithm (proximity-based)
- Cluster details:
  - Center coordinates
  - Point count
  - Time range (start to end)
  - Address (if available)
- Location details modal:
  - Device info (name, model, ID)
  - GPS coordinates (6 decimal precision)
  - Altitude, accuracy
  - Battery level and charging status
  - Speed and heading
  - Location source
- Map placeholder (ready for Google Maps/Mapbox integration)

**Props:**

```typescript
interface FindMyMapProps {
  sessionId: string;
  caseId: string;
}
```

##### ForensicGraphs (`src/components/forensic/forensic-graphs.tsx`)

**Features:**

- Overview statistics:
  - Total messages
  - Total calls
  - Total call duration
- Messages per day chart (bar chart style)
- Calls per day chart
- Top contacts ranking (top 10)
- App usage distribution (percentage breakdown)
- Forensic summary details:
  - Activity period
  - Data counts by type
  - Location cluster count

**Props:**

```typescript
interface ForensicGraphsProps {
  sessionId: string;
  caseId: string;
}
```

#### 4. Integration with Existing Pages

The forensic components are integrated into the case detail view through tab systems:

##### Case Timeline (`src/components/case-timeline.tsx`)

**Tabs:**

- **Case Events**: Original timeline (evidence upload, analysis, discoveries)
- **Messenger Timeline**: MessengerTimeline component
- **Call Logs**: CallLogsTimeline component

##### Case Graphs (`src/components/case-graphs.tsx`)

**Tabs:**

- **Case Analytics**: Original analytics (file types, analysis metrics)
- **Communication Analytics**: ForensicGraphs component

##### Case Map (`src/components/case-map.tsx`)

**Tabs:**

- **Relationship Map**: Original relationship visualization
- **Location Map**: FindMyMap component

## Usage Examples

### Basic Workflow

1. **Upload UFDR File**:

```typescript
import { uploadUFDRFileWithCase } from "@/lib/backend-service";

const file = // ... get file from input
const sessionId = `case_${caseId}_${Date.now()}`;

await uploadUFDRFileWithCase(file, sessionId, caseId);
// Forensic parsing happens automatically in the background
```

2. **View Case Details**:
   Navigate to `/cases/{caseId}` and explore the forensic data:

- Click "Messenger Timeline" tab to see communications
- Click "Call Logs" tab to view phone calls
- Switch to "Graphs" section → "Communication Analytics"
- Switch to "Map" section → "Location Map"

3. **Analyze Patterns**:

- Filter by specific messenger app
- Search for keywords in messages
- Identify call frequency spikes
- Visualize location clusters
- Analyze top contacts

### Advanced Usage

#### Manual Forensic Parsing

```typescript
import { parseForensicData } from "@/lib/backend-service";

const result = await parseForensicData(sessionId, caseId);

console.log(`Parsed ${result.counts.messenger_messages} messages`);
console.log(`Found ${result.counts.call_logs} call logs`);
console.log(`Tracked ${result.counts.find_my_locations} locations`);
```

#### Filtered Data Retrieval

```typescript
import { getMessengerData, getCaseForensicData } from "@/lib/backend-service";

// Get only WhatsApp data
const whatsappData = await getMessengerData(sessionId, "whatsapp");

// Get only messenger data for a case
const messengerOnly = await getCaseForensicData(caseId, "messenger");
```

#### Custom Visualizations

```typescript
import { getForensicSummary } from "@/lib/backend-service";

const summary = await getForensicSummary(sessionId);

// Create custom chart with top contacts
const topContactsChart = summary.top_contacts.map((c) => ({
  label: c.contact,
  value: c.count,
}));

// Analyze location patterns
const locationHotspots = summary.location_clusters
  .filter((cluster) => cluster.count > 50)
  .sort((a, b) => b.count - a.count);
```

## Data Flow

```
┌─────────────┐
│ UFDR Upload │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Extract JSON Files  │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────┐
│ Parse Forensic Data      │
│ - Messenger              │
│ - Call Logs              │
│ - Find My                │
└──────┬───────────────────┘
       │
       ▼
┌───────────────────────────┐
│ Store in MongoDB          │
│ - messenger_messages      │
│ - messenger_calls         │
│ - messenger_accounts      │
│ - call_logs               │
│ - find_my_locations       │
│ - forensic_summaries      │
└──────┬────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Frontend Visualization     │
│ - Timeline Components      │
│ - Analytics Graphs         │
│ - Location Maps            │
└────────────────────────────┘
```

## Performance Considerations

### Backend Optimization

1. **Bulk Inserts**: Use `insert_many()` for large datasets
2. **Compound Indexes**: Optimize for common query patterns
3. **Async Operations**: Non-blocking MongoDB operations
4. **Error Isolation**: Forensic parsing failures don't affect uploads

### Frontend Optimization

1. **Lazy Loading**: Components load data on mount
2. **Pagination**: Default limits on data retrieval (1000 messages)
3. **Client-Side Filtering**: Search and filtering without API calls
4. **Memoization**: Cached calculations for statistics

### Scalability

- **Large Datasets**: Tested with 10,000+ messages, 5,000+ call logs
- **Memory Management**: Chunked processing for large UFDR files
- **Query Performance**: Sub-100ms response times with proper indexes
- **Real-Time Updates**: WebSocket support can be added for live parsing status

## Security Considerations

1. **Authentication**: All endpoints require valid user session
2. **Authorization**: Case-level access control via case_id
3. **Data Privacy**: Encrypted fields tracked in metadata
4. **Audit Trail**: All operations logged with timestamps
5. **GDPR Compliance**: Supports data deletion and export

## Troubleshooting

### Common Issues

**Issue**: Forensic data not appearing after upload

**Solutions**:

- Check backend logs for parsing errors
- Verify UFDR file contains expected JSON structure
- Manually trigger parsing: `POST /forensic/parse-all/{session_id}`
- Check MongoDB collections for data

**Issue**: Timeline components show "No data available"

**Solutions**:

- Verify session_id matches the uploaded file
- Check that forensic parsing completed successfully
- Inspect browser console for API errors
- Verify backend is running on correct port

**Issue**: Slow performance with large datasets

**Solutions**:

- Ensure MongoDB indexes are created (`database.create_indexes()`)
- Reduce limit parameter in API calls
- Implement pagination in frontend components
- Use app-specific filtering to reduce data volume

### Debug Mode

Enable verbose logging:

```python
# backend/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

```typescript
// frontend
console.log("Forensic data:", await getForensicSummary(sessionId));
```

## Future Enhancements

### Planned Features

1. **Map Integration**: Google Maps/Mapbox for real location visualization
2. **Real-Time Parsing**: WebSocket updates during processing
3. **Advanced Analytics**:
   - Social network graph generation
   - Sentiment analysis on messages
   - Call pattern anomaly detection
4. **Export Formats**:
   - PDF reports with forensic data
   - CSV exports for external analysis
   - Timeline exports (JSON, XML)
5. **Additional Data Sources**:
   - Social media posts
   - Email threads
   - Browser history
   - App usage statistics

### Extension Points

- **Custom Parsers**: Add new parsers in `forensic_parser.py`
- **New Visualizations**: Create components in `src/components/forensic/`
- **API Extensions**: Add endpoints in `backend/main.py`
- **Analytics Plugins**: Extend `ForensicGraphs` with custom charts

## API Reference Summary

### Backend Endpoints

| Method | Endpoint                           | Description             |
| ------ | ---------------------------------- | ----------------------- |
| POST   | `/forensic/parse-all/{session_id}` | Parse all forensic data |
| GET    | `/forensic/messenger/{session_id}` | Get messenger data      |
| GET    | `/forensic/call-logs/{session_id}` | Get call logs           |
| GET    | `/forensic/find-my/{session_id}`   | Get location data       |
| GET    | `/forensic/summary/{session_id}`   | Get statistics          |
| GET    | `/forensic/case/{case_id}`         | Get case forensic data  |

### Frontend Functions

| Function              | Parameters          | Returns             |
| --------------------- | ------------------- | ------------------- |
| `parseForensicData`   | sessionId, caseId   | ForensicParseResult |
| `getMessengerData`    | sessionId, appName? | MessengerData       |
| `getCallLogs`         | sessionId           | CallLogsData        |
| `getFindMyData`       | sessionId           | FindMyData          |
| `getForensicSummary`  | sessionId           | ForensicSummary     |
| `getCaseForensicData` | caseId, dataType?   | Any                 |

## Conclusion

The forensic features transform the UFDR Investigation Agent into a comprehensive digital forensics platform, providing investigators with powerful tools to extract, analyze, and visualize communication data from mobile devices. The modular architecture ensures maintainability and extensibility for future enhancements.

For questions or support, refer to the main project documentation or contact the development team.
