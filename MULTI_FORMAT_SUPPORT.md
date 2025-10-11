# Multi-Format UFDR Support

## Overview

The UFDR Investigation Agent now supports **multi-format forensic data bundles**, not just single JSON files. This allows proper extraction of calls, messages, and locations from real-world UFDR exports that contain multiple file types.

## Supported Formats

### 1. JSON Files (`.json`)

- **report_data.json** - Main structured data
- **calls.json**, **contacts.json**, **messages.json** - Individual data types
- **WhatsApp/Telegram chat exports**

**Supported Schemas:**

```json
{
  "calls": [...],
  "messages": [...],
  "locations": [...],
  "contacts": [...],
  "browser_history": [...],
  "apps": [
    {
      "app": "WhatsApp",
      "groups": [
        {
          "name": "Group Name",
          "messages": [...]
        }
      ]
    }
  ],
  "device_info": {...},
  "extraction_info": {...}
}
```

### 2. XML Files (`.xml`)

- **comms_log.xml** - Call and message logs
- Cellebrite exports often use XML

**Example Structure:**

```xml
<root>
  <calls>
    <call timestamp="2025-09-24T18:00:00Z">
      <from>+15550001001</from>
      <to>+15550001002</to>
      <duration>45</duration>
      <type>outgoing</type>
    </call>
  </calls>
  <messages>
    <message timestamp="2025-09-24T18:30:00Z">
      <from>+15550001001</from>
      <to>+15550001002</to>
      <body>Message text</body>
      <type>SMS</type>
    </message>
  </messages>
  <locations>
    <location timestamp="2025-09-24T18:00:00Z">
      <latitude>19.0760</latitude>
      <longitude>72.8777</longitude>
      <note>Location name</note>
    </location>
  </locations>
</root>
```

### 3. CSV Files (`.csv`)

- **browser_history.csv** - Web browsing data
- **call_logs.csv** - Call records
- **messages.csv** - SMS/message exports
- **locations.csv** - GPS data

**Auto-Detection:**
The parser automatically detects CSV type based on:

- Column headers (`from`, `to`, `url`, `latitude`, etc.)
- Filename (`call`, `message`, `history`, `location`)

**Example CSV Formats:**

**Calls:**

```csv
from,to,datetime,duration,type
+15550001001,+15550001002,2025-09-24T18:00:00Z,45,outgoing
```

**Messages:**

```csv
from,to,body,timestamp,type
+15550001001,+15550001002,"Hello world",2025-09-24T18:30:00Z,SMS
```

**Locations:**

```csv
latitude,longitude,timestamp,note
19.0760,72.8777,2025-09-24T18:00:00Z,"Bandra"
```

### 4. Text Files (`.txt`)

- **notes.txt** - Human-entered case notes
- Extracted and stored in metadata
- Phone numbers and timestamps are auto-extracted

### 5. HTML Files (`.html`, `.htm`)

- **summary_report.html** - Case summaries
- **analysis_report.html** - Forensic reports
- Text content is extracted for search

## How It Works

### 1. Upload Detection

When you upload a UFDR file:

```python
# Backend automatically detects format
if zipfile.is_zipfile(file):
    # Multi-file UFDR bundle
    use_multi_format_parser()
else:
    # Single JSON file
    use_original_parser()
```

### 2. Multi-Format Parsing Pipeline

```
UFDR Upload
    ↓
Extract ZIP (if applicable)
    ↓
Detect File Types (.json, .xml, .csv, .txt, .html)
    ↓
Parse Each Format
    ↓
Normalize Data (calls, messages, locations, contacts)
    ↓
Merge & Deduplicate
    ↓
Store in MongoDB
```

### 3. Data Normalization

All formats are converted to a standard schema:

**Calls:**

```python
{
    'id': 'call_xxx',
    'from': '+15550001001',
    'to': '+15550001002',
    'datetime': '2025-09-24T18:00:00Z',
    'duration': '45',
    'type': 'outgoing',
    '_source': 'parsed'  # Tracks origin
}
```

**Messages:**

```python
{
    'id': 'msg_xxx',
    'from': '+15550001001',
    'to': '+15550001002',
    'body': 'Message text',
    'timestamp': '2025-09-24T18:30:00Z',
    'type': 'SMS',
    'app': 'whatsapp',  # If from messaging app
    'group_name': 'Group Name',  # If from group chat
    '_source': 'parsed'
}
```

**Locations:**

```python
{
    'latitude': '19.0760',
    'longitude': '72.8777',
    'timestamp': '2025-09-24T18:00:00Z',
    'note': 'Location name',
    '_source': 'parsed'
}
```

### 4. Deduplication

The system automatically removes duplicates based on:

- **Calls:** `from + to + datetime`
- **Messages:** `from + to + timestamp + body`
- **Locations:** `latitude + longitude + timestamp`
- **Contacts:** `phone number`

This prevents duplicates when the same data appears in multiple files (JSON + XML).

## Usage Examples

### Example 1: Multi-File UFDR Bundle

Upload a ZIP containing:

```
my_case.ufdr (ZIP)
├── report_data.json     ✅ Calls, messages, locations
├── comms_log.xml        ✅ Additional call/message data
├── browser_history.csv  ✅ Web history
├── notes.txt           ✅ Investigator notes
└── summary.html        ✅ Summary report
```

**Result:**

- All calls from JSON + XML are merged
- All messages from JSON + XML are merged
- Browser history is extracted from CSV
- Notes are stored as metadata
- Duplicates are removed

### Example 2: Single JSON File

Upload `case_data.json`:

```json
{
  "calls": [...],
  "messages": [...],
  "locations": [...]
}
```

**Result:**

- Uses fast single-file parser
- No extraction needed

### Example 3: Flat Structure UFDR

Your current `chori.ufdr` format:

```json
{
  "device_info": {...},
  "contacts": [...],
  "calls": [...],
  "messages": [...],
  "locations": [...],
  "apps": [...]
}
```

**Result:**

- ✅ Root-level arrays detected
- ✅ SMS messages extracted
- ✅ WhatsApp groups parsed
- ✅ Call logs with contact name lookup
- ✅ Locations with device context

## Frontend Improvements

### Fallback Messages

The UI now shows helpful hints when data is missing:

```typescript
// Before
"No call logs found";

// After
if (!calls.length && hasXMLFiles) {
  ("XML data detected but not parsed. Please re-upload.");
}
```

### Smart Detection

```typescript
const messages =
  data.messages || // Standard
  data.chats || // Alternative
  data.sms || // SMS specific
  data.communications || // Generic
  [];
```

## API Changes

### Upload Endpoint

```python
POST /upload/
```

**Behavior:**

1. Detects if UFDR is ZIP or single file
2. Uses appropriate parser
3. Extracts calls, messages, locations, contacts
4. Merges data from all sources
5. Deduplicates automatically
6. Stores in MongoDB

**Response:**

```json
{
  "message": "UFDR file processed successfully",
  "chunks": 150,
  "session_id": "case_xxx_1234567890",
  "saved_to_db": true,
  "forensic_data": {
    "calls": 12,
    "messages": 45,
    "locations": 8,
    "contacts": 20
  }
}
```

## Troubleshooting

### Issue: "No data found"

**Cause:** Unsupported format or incorrect structure

**Solution:**

1. Check file extensions (must be `.json`, `.xml`, `.csv`, `.txt`, `.html`)
2. Verify data structure matches supported schemas
3. Check backend logs for parsing errors

### Issue: "Duplicate data"

**Cause:** Same data in multiple files without deduplication

**Solution:**

- System automatically deduplicates
- If duplicates persist, check timestamp formats match

### Issue: "XML not parsed"

**Cause:** XML structure doesn't match expected schema

**Solution:**

- Ensure XML has `<calls>`, `<messages>`, `<locations>` elements
- Check element names match expected format

## Performance

### Single JSON

- **Speed:** ~100ms
- **Memory:** ~5MB for 1MB JSON

### Multi-File UFDR (ZIP)

- **Speed:** ~500ms (includes extraction)
- **Memory:** ~20MB for 10 files
- **Concurrent:** Supports multiple uploads

## Debugging

Enable debug output in `forensic_parser.py`:

```python
[DEBUG] parse_all_forensic_data received keys: ['calls', 'messages', 'locations']
[DEBUG] Has 'messages': True
[DEBUG] Has 'calls': True
[DEBUG] Has 'locations': True
[DEBUG] parse_messenger_data returned: 7 messages, 0 calls, 0 accounts
[DEBUG] parse_call_logs returned: 4 call logs
[DEBUG] parse_find_my_data returned: 3 locations
```

**Multi-format output:**

```
Multi-format parsing complete:
  Calls: 12
  Messages: 45
  Locations: 8
  Contacts: 20
  Browser History: 150
  Apps: 2
```

## Best Practices

1. **Always upload the full UFDR bundle** (ZIP with all files)
2. **Include all available formats** (JSON + XML + CSV when possible)
3. **Name files descriptively** (`call_logs.csv`, not `data.csv`)
4. **Use standard schemas** for better auto-detection
5. **Check MongoDB** after upload to verify data stored correctly

## Future Enhancements

- [ ] Support for `.db` files (SQLite databases)
- [ ] Excel (`.xlsx`) parsing
- [ ] PDF report extraction
- [ ] Image metadata (EXIF) parsing
- [ ] Audio file transcription
- [ ] Video frame analysis

## Summary

✅ **Multi-format support implemented**
✅ **Handles JSON, XML, CSV, TXT, HTML**
✅ **Automatic format detection**
✅ **Data normalization & deduplication**
✅ **Backward compatible with single JSON**
✅ **Full MongoDB integration**

Your UFDR Investigation Agent now handles real-world forensic bundles with multiple file formats! 🎉
