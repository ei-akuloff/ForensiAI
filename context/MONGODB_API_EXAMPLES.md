# MongoDB API Examples

This document provides practical examples for using the MongoDB-integrated API endpoints.

## Base URL

```
http://localhost:8000
```

## Authentication

_(Add authentication headers when implemented)_

---

## 1. Case Management APIs

### Create a New Case

**Endpoint:** `POST /cases/`

**cURL Example:**

```bash
curl -X POST "http://localhost:8000/cases/" \
  -F "title=Murder Investigation - Downtown" \
  -F "description=Investigation of suspicious activity in downtown area" \
  -F "case_number=CASE-2024-001" \
  -F "priority=high" \
  -F "created_by=investigator_123"
```

**Python Example:**

```python
import requests

response = requests.post(
    "http://localhost:8000/cases/",
    data={
        "title": "Murder Investigation - Downtown",
        "description": "Investigation of suspicious activity in downtown area",
        "case_number": "CASE-2024-001",
        "priority": "high",
        "created_by": "investigator_123"
    }
)
print(response.json())
```

**Response:**

```json
{
  "message": "Case created successfully",
  "case": {
    "case_id": "550e8400-e29b-41d4-a716-446655440000",
    "case_number": "CASE-2024-001",
    "title": "Murder Investigation - Downtown",
    "description": "Investigation of suspicious activity in downtown area",
    "status": "active",
    "priority": "high",
    "created_by": "investigator_123",
    "created_at": "2024-10-10T10:30:00",
    "updated_at": "2024-10-10T10:30:00"
  }
}
```

---

### List All Cases

**Endpoint:** `GET /cases/`

**cURL Example:**

```bash
# Get all active cases
curl "http://localhost:8000/cases/?status=active&limit=50"

# Get all cases regardless of status
curl "http://localhost:8000/cases/?limit=100"
```

**Python Example:**

```python
import requests

# Get active cases
response = requests.get("http://localhost:8000/cases/", params={
    "status": "active",
    "limit": 50
})
print(response.json())
```

**Response:**

```json
{
  "cases": [
    {
      "case_id": "550e8400-e29b-41d4-a716-446655440000",
      "case_number": "CASE-2024-001",
      "title": "Murder Investigation - Downtown",
      "status": "active",
      "priority": "high",
      "created_at": "2024-10-10T10:30:00"
    }
  ],
  "count": 1
}
```

---

### Get Case Details

**Endpoint:** `GET /cases/{case_id}`

**cURL Example:**

```bash
curl "http://localhost:8000/cases/550e8400-e29b-41d4-a716-446655440000"
```

**Python Example:**

```python
import requests

case_id = "550e8400-e29b-41d4-a716-446655440000"
response = requests.get(f"http://localhost:8000/cases/{case_id}")
print(response.json())
```

**Response:**

```json
{
  "case": {
    "case_id": "550e8400-e29b-41d4-a716-446655440000",
    "case_number": "CASE-2024-001",
    "title": "Murder Investigation - Downtown",
    "description": "Investigation of suspicious activity in downtown area",
    "status": "active",
    "priority": "high",
    "created_by": "investigator_123",
    "created_at": "2024-10-10T10:30:00",
    "updated_at": "2024-10-10T10:30:00"
  },
  "sessions": [],
  "files": [],
  "analysis_results": []
}
```

---

### Update Case

**Endpoint:** `PUT /cases/{case_id}`

**cURL Example:**

```bash
curl -X PUT "http://localhost:8000/cases/550e8400-e29b-41d4-a716-446655440000" \
  -F "title=Murder Investigation - Updated" \
  -F "status=closed" \
  -F "priority=medium"
```

**Python Example:**

```python
import requests

case_id = "550e8400-e29b-41d4-a716-446655440000"
response = requests.put(
    f"http://localhost:8000/cases/{case_id}",
    data={
        "title": "Murder Investigation - Updated",
        "status": "closed",
        "priority": "medium"
    }
)
print(response.json())
```

---

## 2. Session Management APIs

### Create a Session

**Endpoint:** `POST /sessions/`

**cURL Example:**

```bash
curl -X POST "http://localhost:8000/sessions/" \
  -F "session_id=session-abc-123" \
  -F "case_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "user_id=investigator_123"
```

**Python Example:**

```python
import requests

response = requests.post(
    "http://localhost:8000/sessions/",
    data={
        "session_id": "session-abc-123",
        "case_id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "investigator_123"
    }
)
print(response.json())
```

---

### Get Sessions for a Case

**Endpoint:** `GET /cases/{case_id}/sessions`

**cURL Example:**

```bash
curl "http://localhost:8000/cases/550e8400-e29b-41d4-a716-446655440000/sessions"
```

**Python Example:**

```python
import requests

case_id = "550e8400-e29b-41d4-a716-446655440000"
response = requests.get(f"http://localhost:8000/cases/{case_id}/sessions")
print(response.json())
```

---

## 3. File Upload with MongoDB Integration

### Upload UFDR File

**Endpoint:** `POST /upload/`

**cURL Example:**

```bash
curl -X POST "http://localhost:8000/upload/" \
  -F "file=@chori.ufdr" \
  -F "session_id=session-abc-123" \
  -F "case_id=550e8400-e29b-41d4-a716-446655440000"
```

**Python Example:**

```python
import requests

with open("chori.ufdr", "rb") as file:
    response = requests.post(
        "http://localhost:8000/upload/",
        files={"file": file},
        data={
            "session_id": "session-abc-123",
            "case_id": "550e8400-e29b-41d4-a716-446655440000"
        }
    )
print(response.json())
```

**Response:**

```json
{
  "message": "UFDR file processed and stored successfully",
  "chunks": 150,
  "session_id": "session-abc-123",
  "saved_to_db": true
}
```

---

### Upload Encrypted UFDR

**Endpoint:** `POST /upload-encrypted-ufdr/`

**cURL Example:**

```bash
curl -X POST "http://localhost:8000/upload-encrypted-ufdr/" \
  -F "file=@encrypted.ufdr.enc" \
  -F "session_id=session-abc-123" \
  -F "decryption_key={\"key_base64\":\"...\",\"iv_base64\":\"...\"}" \
  -F "hash_value=abc123..."
```

---

## 4. Analysis with MongoDB Integration

### Analyze Relationships

**Endpoint:** `POST /analyze-relationships/`

**cURL Example:**

```bash
curl -X POST "http://localhost:8000/analyze-relationships/" \
  -F "session_id=session-abc-123" \
  -F "case_id=550e8400-e29b-41d4-a716-446655440000"
```

**Python Example:**

```python
import requests

response = requests.post(
    "http://localhost:8000/analyze-relationships/",
    data={
        "session_id": "session-abc-123",
        "case_id": "550e8400-e29b-41d4-a716-446655440000"
    }
)
print(response.json())
```

**Response:**

```json
{
  "message": "Relationship analysis completed",
  "session_id": "session-abc-123",
  "analysis": {
    "people": [
      {
        "id": "person_1",
        "name": "John Doe",
        "phone": "+1234567890",
        "type": "contact",
        "frequency": "high",
        "suspicious": false
      }
    ],
    "relationships": [
      {
        "from": "person_1",
        "to": "person_2",
        "type": "friend",
        "strength": "strong",
        "evidence": "Frequent calls and messages",
        "communication_count": 45
      }
    ],
    "summary": "Network analysis shows..."
  },
  "saved_to_db": true
}
```

---

## 5. Complete Workflow Example

### Python Script: Complete Case Workflow

```python
import requests
import uuid

BASE_URL = "http://localhost:8000"

# 1. Create a case
print("1. Creating case...")
case_response = requests.post(
    f"{BASE_URL}/cases/",
    data={
        "title": "Drug Trafficking Investigation",
        "description": "Investigation into suspected drug trafficking network",
        "case_number": f"CASE-{uuid.uuid4().hex[:8]}",
        "priority": "critical",
        "created_by": "detective_01"
    }
)
case_data = case_response.json()
case_id = case_data["case"]["case_id"]
print(f"✅ Case created: {case_id}")

# 2. Create a session
print("\n2. Creating session...")
session_id = f"session-{uuid.uuid4().hex[:8]}"
session_response = requests.post(
    f"{BASE_URL}/sessions/",
    data={
        "session_id": session_id,
        "case_id": case_id,
        "user_id": "detective_01"
    }
)
print(f"✅ Session created: {session_id}")

# 3. Upload UFDR file
print("\n3. Uploading UFDR file...")
with open("data.ufdr", "rb") as file:
    upload_response = requests.post(
        f"{BASE_URL}/upload/",
        files={"file": file},
        data={
            "session_id": session_id,
            "case_id": case_id
        }
    )
upload_data = upload_response.json()
print(f"✅ File uploaded: {upload_data['chunks']} chunks processed")

# 4. Analyze relationships
print("\n4. Analyzing relationships...")
analysis_response = requests.post(
    f"{BASE_URL}/analyze-relationships/",
    data={
        "session_id": session_id,
        "case_id": case_id
    }
)
analysis_data = analysis_response.json()
print(f"✅ Analysis complete: {len(analysis_data['analysis']['people'])} people found")

# 5. Query the data
print("\n5. Querying data...")
query_response = requests.post(
    f"{BASE_URL}/query/",
    data={
        "query": "Who are the main suspects?",
        "session_id": session_id
    }
)
query_data = query_response.json()
print(f"✅ Query response: {query_data['response'][:100]}...")

# 6. Get case details with all data
print("\n6. Getting final case details...")
final_response = requests.get(f"{BASE_URL}/cases/{case_id}")
final_data = final_response.json()
print(f"✅ Case has {len(final_data['sessions'])} session(s)")
print(f"✅ Case has {len(final_data['files'])} file(s)")
print(f"✅ Case has {len(final_data['analysis_results'])} analysis result(s)")

print("\n🎉 Complete workflow executed successfully!")
```

---

## 6. Testing with Postman

### Import Collection

Create a Postman collection with these requests:

1. **Create Case** - POST `/cases/`
2. **List Cases** - GET `/cases/`
3. **Get Case** - GET `/cases/{case_id}`
4. **Create Session** - POST `/sessions/`
5. **Upload File** - POST `/upload/`
6. **Analyze Relationships** - POST `/analyze-relationships/`
7. **Query** - POST `/query/`

### Environment Variables

Set these in Postman:

- `base_url`: `http://localhost:8000`
- `case_id`: (will be set from response)
- `session_id`: (will be set from response)

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Notes

- All timestamps are in UTC
- File uploads require multipart/form-data
- Session IDs can be any unique string
- Case IDs are UUIDs generated automatically
- MongoDB integration is optional (provide `case_id` to enable)
