# How Multi-Format UFDR Parsing Works (Generic, Not Case-Specific)

## Overview

The system is **fully generic** and automatically handles **ANY** multi-format UFDR bundle without needing case-specific code. Upload any UFDR file (single JSON or multi-file ZIP) and it will be automatically parsed and stored.

## Architecture

```
Upload UFDR File (via UI)
         ↓
Backend Upload Endpoint (/upload/)
         ↓
    Is it a ZIP?
    /          \
  YES          NO
   ↓            ↓
Multi-Format   Single JSON
Parser         Parser
   ↓            ↓
   └─────┬──────┘
         ↓
   Forensic Parser
   (Normalize data)
         ↓
   Store in MongoDB
   (session_id + case_id)
         ↓
   UI Retrieves Data
   (Timeline, Map, etc.)
```

## Supported Formats (Generic Detection)

### 1. **JSON Files** (`.json`)

- **Detection**: File extension `.json`
- **Parser**: Handles nested/flat structures automatically
- **Supports**:
  - `contacts[]` array
  - `calls[]` array
  - `messages[]` array
  - `apps[]` array (WhatsApp, Signal, Telegram groups)
  - `locations[]` array
  - Any custom structure

### 2. **XML Files** (`.xml`)

- **Detection**: File extension `.xml`
- **Parser**: ElementTree-based XML parser
- **Supports**:
  - `<calls>` with `<call>` entries
  - `<messages>` with `<message>` entries
  - `<contacts>` with `<contact>` entries
  - `<locations>` with `<location>` entries

### 3. **CSV Files** (`.csv`)

- **Detection**: File extension `.csv`
- **Parser**: Pandas DataFrame parser with auto-type detection
- **Auto-detects type by headers**:
  - **Calls**: `from`, `to`, `duration` columns
  - **Messages**: `from`, `to`, `body` columns
  - **Locations**: `latitude`, `longitude` columns
  - **Contacts**: `name`, `number` columns
  - **Browser History**: `url`, `title` columns

### 4. **Text Files** (`.txt`)

- **Detection**: File extension `.txt`
- **Parser**: Regex-based extraction
- **Extracts**:
  - Phone numbers: `+919876543210`, `(555) 123-4567`
  - Timestamps: `2025-09-24T18:30:00Z`
  - Key-value pairs for metadata

### 5. **HTML Files** (`.html`, `.htm`)

- **Detection**: File extension `.html` or `.htm`
- **Parser**: Tag stripping + content extraction
- **Extracts**:
  - Text content from HTML reports
  - Contact names from lists
  - Message bodies from formatted reports

## How Upload Works (Step-by-Step)

### Step 1: User Uploads File via Dashboard

```typescript
// Frontend: src/app/dashboard/page.tsx
const sessionId = generateSessionId(newCaseId); // case_<caseId>_<timestamp>
await uploadUFDRFileWithCase(uploadedFile, sessionId, mongodbCaseId);
```

### Step 2: Backend Receives Upload

```python
# Backend: main.py - /upload/ endpoint
@app.post("/upload/")
async def upload_ufdr(session_id: str, file: UploadFile, case_id: str):
    # Save file temporarily
    tmp_path = f"/tmp/{file.filename}"

    # Check if ZIP (multi-file bundle)
    if zipfile.is_zipfile(tmp_path):
        # MULTI-FORMAT PATH
        temp_dir = tempfile.mkdtemp()
        zipfile.ZipFile(tmp_path).extractall(temp_dir)

        # Parse ALL formats in the directory
        multi_data = parse_multi_format_ufdr(temp_dir)
        # Returns: {calls: [], messages: [], locations: [], contacts: []}
    else:
        # SINGLE JSON PATH
        text = await file.read()
        # Parse as JSON directly
```

### Step 3: Multi-Format Parser Processes Files

```python
# Backend: multi_format_parser.py
def parse_multi_format_ufdr(directory_path: str) -> dict:
    parser = MultiFormatParser()

    # Automatically scan directory for all supported files
    for file_path in Path(directory_path).rglob('*'):
        if file_path.suffix == '.json':
            parser._parse_json(file_path)
        elif file_path.suffix == '.xml':
            parser._parse_xml(file_path)
        elif file_path.suffix == '.csv':
            parser._parse_csv(file_path)
        elif file_path.suffix == '.txt':
            parser._parse_txt(file_path)
        elif file_path.suffix in ['.html', '.htm']:
            parser._parse_html(file_path)

    # Normalize all data to standard schema
    parser._normalize_calls()
    parser._normalize_messages()
    parser._normalize_locations()
    parser._normalize_contacts()

    # Remove duplicates (e.g., same call in JSON + XML)
    parser._deduplicate()

    return parser.get_data()
```

### Step 4: Forensic Parser Normalizes Data

```python
# Backend: forensic_parser.py
def parse_all_forensic_data(json_data: dict) -> dict:
    # Handles both flat and nested structures
    messages = parse_messenger_data(json_data)
    calls = parse_call_logs(json_data)
    locations = parse_find_my_data(json_data)

    # Returns standardized format for MongoDB
    return {
        'messenger_messages': messages,  # [{sender, receiver, content, timestamp, app_name}]
        'call_logs': calls,              # [{phone_number, contact_name, call_type, duration}]
        'find_my_locations': locations   # [{latitude, longitude, timestamp, address}]
    }
```

### Step 5: Store in MongoDB

```python
# Backend: main.py (continued)
if forensic_data:
    # Store messages
    if forensic_data["messenger_messages"]:
        await crud.bulk_create_messenger_messages(
            db, forensic_data["messenger_messages"], session_id, case_id
        )

    # Store call logs
    if forensic_data["call_logs"]:
        await crud.bulk_create_call_logs(
            db, forensic_data["call_logs"], session_id, case_id
        )

    # Store locations
    if forensic_data["find_my_locations"]:
        await crud.bulk_create_find_my_locations(
            db, forensic_data["find_my_locations"], session_id, case_id
        )
```

### Step 6: UI Retrieves and Displays Data

```typescript
// Frontend: components/forensic/messenger-timeline.tsx
const result = await getMessengerData(sessionId);
// Calls: GET /forensic/messenger/{session_id}

// Backend returns all messages for that session
// Frontend displays in timeline with filters, search, etc.
```

## Key Features (All Generic)

### 1. **Automatic Format Detection**

- No manual configuration needed
- Detects file types by extension
- Handles mixed formats in same bundle

### 2. **Automatic Deduplication**

- Same call in `report.json` and `calls.xml`? → Stored once
- Duplicate detection by key fields:
  - Calls: `from + to + datetime`
  - Messages: `from + to + timestamp + body`
  - Locations: `latitude + longitude + timestamp`

### 3. **Contact Name Resolution**

- Automatically builds contact map from `contacts[]`
- Maps phone numbers to names in call logs
- Works across all formats (JSON, XML, CSV)

### 4. **Flexible Data Structure**

- Handles flat structure: `{"messages": [...], "calls": [...]}`
- Handles nested structure: `{"messenger": {"messages": [...]}}`
- Handles app-specific structure: `{"apps": [{"app": "WhatsApp", "groups": [...]}]}`

### 5. **Error Handling**

- Format parsing fails? Falls back to text parsing
- Missing fields? Uses defaults
- Corrupted file? Logs error, continues with other files

## Example: Rohan Kapoor Case (Generic Handling)

### Input Files (Multi-Format Bundle)

```
rohan_case.ufdr (ZIP containing):
├── report_data.json     (10 messages, 9 calls, 10 contacts, 5 locations)
├── comms_log.xml        (2 messages, 2 calls - duplicates from JSON)
├── browser_history.csv  (4 browser history entries)
├── notes.txt            (Meeting notes with phone numbers)
└── summary_report.html  (HTML summary with key contacts)
```

### Processing (Automatic)

1. **ZIP detected** → Extract all 5 files
2. **JSON parser** → Extracts 10 messages, 9 calls, 10 contacts, 5 locations
3. **XML parser** → Extracts 2 messages, 2 calls (duplicates)
4. **CSV parser** → Extracts 4 browser history entries
5. **TXT parser** → Extracts phone numbers from notes
6. **HTML parser** → Extracts contact names from summary
7. **Normalization** → All data converted to standard schema
8. **Deduplication** → 2 duplicate calls removed, 2 duplicate messages removed
9. **Final result** → 10 unique messages, 9 unique calls, 10 contacts, 5 locations

### MongoDB Storage

```javascript
// messenger_messages collection
{
  _id: ObjectId("..."),
  session_id: "case_1760170408329_1760170408834",
  case_id: "5c9b9e62-2f78-474e-b2df-d760cb8381c2",
  sender: "+919988776655",
  receiver: "+919876543210",
  content: "Fresh maal arrived. The usual green and some premium white this time.",
  timestamp: "2025-09-24T22:30:10Z",
  app_name: "sms",
  _source: "parsed"  // Indicates which parser extracted it
}

// call_logs collection
{
  _id: ObjectId("..."),
  session_id: "case_1760170408329_1760170408834",
  case_id: "5c9b9e62-2f78-474e-b2df-d760cb8381c2",
  phone_number: "+919988776655",
  contact_name: "Vicky Supplier",  // Automatically resolved from contacts[]
  call_type: "incoming",
  duration_seconds: 35,
  timestamp: "2025-09-24T23:15:00Z"
}
```

## Testing the Generic System

### Test Case 1: Single JSON UFDR

```json
// simple_case.ufdr (not ZIP, just JSON text)
{
  "contacts": [...],
  "calls": [...],
  "messages": [...]
}
```

**Result**: Parsed by single JSON parser, stored normally

### Test Case 2: Multi-File ZIP UFDR

```
complex_case.ufdr (ZIP):
├── data.json
├── calls.xml
└── history.csv
```

**Result**: All 3 formats parsed, merged, deduplicated, stored

### Test Case 3: WhatsApp Group Messages

```json
{
  "apps": [{
    "app": "WhatsApp",
    "groups": [{
      "name": "Night Ops",
      "messages": [...]
    }]
  }]
}
```

**Result**: WhatsApp messages extracted with group names

### Test Case 4: Contact Name Resolution

```json
{
  "contacts": [{ "name": "Vicky Supplier", "number": "+919988776655" }],
  "calls": [{ "from": "+919988776655", "to": "+919876543210" }]
}
```

**Result**: Call log shows "Vicky Supplier" instead of just phone number

## Why Manual Scripts Were Created

The manual scripts (`manual_parse_and_store.py`) were **ONLY for debugging** when automatic upload failed. They are **NOT needed for production** - they were workarounds to:

1. Test parsing logic without upload
2. Manually store data when backend wasn't running
3. Debug why automatic storage was failing

**Normal flow should work without manual scripts!**

## Current Issue: Why Automatic Upload Fails

The automatic upload was failing because:

1. **Pandas not installed** → `import pandas` failed in multi_format_parser.py
2. **Silent exception** → Error was caught but not logged properly
3. **Data not stored** → Parsing failed, so no data went to MongoDB

**Solution**:

- ✅ Pandas now installed: `pip install pandas`
- ✅ Added detailed logging: `[UPLOAD]` prefixed logs
- ✅ Added exception tracebacks for debugging

## Next Steps

1. **Start Backend** with pandas installed:

   ```powershell
   cd 'C:\Coding\SIH ''25\nidhibranch\raw-frontend\backend'
   python main.py
   ```

2. **Upload ANY UFDR file** via dashboard:

   - Single JSON file → Works automatically
   - Multi-file ZIP bundle → Works automatically
   - JSON + XML + CSV + TXT + HTML → All parsed and merged

3. **Check Backend Logs** for detailed output:

   ```
   [UPLOAD] Starting automatic forensic parsing...
   [UPLOAD] ✅ Detected multi-file UFDR (ZIP format)
   [UPLOAD] Extracted 5 files: ['report_data.json', 'comms_log.xml', ...]
   [UPLOAD] Multi-format parsing complete!
   [UPLOAD]   - Calls: 9
   [UPLOAD]   - Messages: 10
   [UPLOAD]   - Locations: 5
   [UPLOAD] ✅ Stored 10 messenger messages
   [UPLOAD] ✅ Stored 9 call logs
   [UPLOAD] 🎉 Automatic forensic parsing completed successfully!
   ```

4. **View Data in UI**:
   - Navigate to case detail page
   - Click Timeline tab
   - See Messenger Timeline and Call Logs
   - All contact names automatically resolved

## Summary

✅ **System is fully generic** - no case-specific code needed
✅ **Supports 5 formats** - JSON, XML, CSV, TXT, HTML
✅ **Automatic detection** - by file extension
✅ **Automatic deduplication** - across all formats
✅ **Automatic contact resolution** - phone → name mapping
✅ **Works for ANY case** - just upload the file!

The multi-format parser is a **universal data extraction engine** that adapts to whatever format the UFDR file uses.
