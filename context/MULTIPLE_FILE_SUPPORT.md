# Multiple File Type Support for UFDR AI Chatbot

This document describes the enhanced capabilities of the UFDR AI Chatbot to handle multiple types of forensic data files.

## Overview

The chatbot has been updated to understand and process the following types of forensic data:

- **calls.json** - Phone call records with timestamps, participants, duration, and call types
- **contacts.json** - Contact information including names, phone numbers, and user IDs
- **locations.json** - GPS coordinates with timestamps for movement tracking
- **manifest.json** - Dataset overview with file counts and metadata
- **WhatsApp Chat Files** (WA_Chat_*.json) - Message history with participants, timestamps, and attachments
- **Telegram Chat Files** (TG_Chat_*.json) - Message data with group participants, timestamps, and media files

## New Backend Endpoints

### 1. Upload Single JSON File
```
POST /upload-single-json/
```
Upload a single JSON file for processing.

**Parameters:**
- `file`: JSON file to upload
- `session_id`: Unique session identifier

**Response:**
```json
{
  "message": "JSON file processed and stored successfully",
  "chunks": 150,
  "session_id": "session_1234567890_abc123",
  "file_type": "calls.json"
}
```

### 2. Upload Multiple JSON Files
```
POST /upload-multiple/
```
Upload multiple JSON files at once for comprehensive analysis.

**Parameters:**
- `files`: Array of JSON files to upload
- `session_id`: Unique session identifier

**Response:**
```json
{
  "message": "Successfully processed 6 JSON files",
  "total_chunks": 1200,
  "session_id": "session_1234567890_abc123",
  "files_processed": ["calls.json", "contacts.json", "locations.json", "manifest.json", "WA_Chat_1.json", "TG_Chat_1.json"]
}
```

### 3. Enhanced Query Endpoint
```
POST /query/
```
Query the AI system with enhanced forensic analysis capabilities.

**Parameters:**
- `query`: User's question/query
- `session_id`: Session identifier
- `language`: Optional language parameter (auto-detected if not provided)

**Response:**
```json
{
  "query": "What communication patterns exist?",
  "response": "Analysis shows communication patterns across WhatsApp and Telegram...",
  "context_used": true,
  "session_id": "session_1234567890_abc123",
  "detected_language": "English",
  "debug_info": {
    "explicit_language": null,
    "auto_detected": "English",
    "instruction_sent": "IMPORTANT: You MUST respond in English only..."
  }
}
```

## Data Type Formatting

The system automatically formats different data types for optimal AI analysis:

### Call Records
```
CALL RECORDS:
Call ID: call_1
Date/Time: 2023-05-19T18:06:01Z
From: Vikram Joshi
To: Tanvi Verma
Duration: 2364 seconds
Type: incoming
Device: Mobile
```

### Contact Records
```
CONTACT RECORDS:
Contact ID: user_78738
Name: Aarav Sharma
Phone: +917149496231
```

### Location Records
```
LOCATION RECORDS:
Location ID: loc_1
Latitude: 19.44663
Longitude: 72.406742
Timestamp: 1673386610
```

### WhatsApp Chat Data
```
WHATSAPP CHAT: WA_Chat_1
MEMBERS:
- Karan Kapoor (+916289862597)
- Aarav Sharma (+918874406273)

MESSAGES:
From: Aarav Sharma
To: Karan Kapoor
Date/Time: 2023-10-06T18:00:52Z
Text: We should talk in person, not here.
```

### Telegram Chat Data
```
TELEGRAM CHAT: TG_Chat_1
MEMBERS:
- Sakshi Khan (+919245364859)
- Aarav Sharma (+917400639920)

MESSAGES:
From: Riya Patel
To: Sakshi Khan, Aarav Sharma
Date/Time: 2024-10-29T10:36:56Z
Text: Hey, did you get the documents?
```

## Enhanced AI Analysis Capabilities

The updated system can now:

1. **Cross-Platform Correlation**: Match phone numbers across calls, contacts, and chat data
2. **Temporal Analysis**: Analyze communication patterns over time
3. **Location Tracking**: Correlate movement patterns with communication activity
4. **Network Analysis**: Identify communication hubs and relationship patterns
5. **Multilingual Support**: Process and respond in multiple languages including Hindi, Spanish, French, German, Chinese, and more

## Example Queries

### Communication Analysis
- "What communication patterns exist between specific contacts?"
- "Show me the most active communication times"
- "Who are the primary contacts in this dataset?"

### Location Analysis
- "What locations are most frequently visited?"
- "Show me movement patterns during specific time periods"
- "Correlate location data with communication activity"

### Cross-Platform Analysis
- "Compare WhatsApp and Telegram usage patterns"
- "Find contacts who appear in both calls and messages"
- "Identify coordination between different communication platforms"

### Multilingual Queries
- "इस डेटासेट में क्या संचार पैटर्न हैं?" (Hindi)
- "¿Cuáles son los patrones de comunicación más frecuentes?" (Spanish)
- "Quels sont les contacts les plus actifs?" (French)

## Frontend Integration

The frontend has been updated to support the new endpoints:

### New API Functions
```javascript
// Upload multiple JSON files
await uploadMultipleJsonFiles(files)

// Upload single JSON file
await uploadSingleJsonFile(file)

// Query with language support
await queryDataset(sessionId, query, language)
```

### Usage Example
```javascript
// Upload multiple forensic data files
const files = [
  new File([callsData], 'calls.json'),
  new File([contactsData], 'contacts.json'),
  new File([locationsData], 'locations.json')
];

const result = await uploadMultipleJsonFiles(files);

// Query the combined data
const response = await queryDataset(result.id, "What communication patterns exist?");
```

## Testing

Use the provided test script to verify the functionality:

```bash
cd raw-frontend/backend
python test_multiple_files.py
```

This will test:
- Single file uploads
- Multiple file uploads
- Query functionality
- Multilingual support

## Security Considerations

- All file uploads are validated for JSON format
- Session-based data isolation prevents cross-contamination
- Temporary files are automatically cleaned up
- Input sanitization prevents injection attacks

## Performance Notes

- Large datasets are automatically chunked for optimal processing
- Vector embeddings enable fast similarity search
- Session-based storage allows for concurrent users
- Memory usage is optimized through streaming processing

## Future Enhancements

Planned improvements include:
- Support for additional file formats (CSV, XML, etc.)
- Real-time data streaming
- Advanced visualization capabilities
- Enhanced multilingual support for regional languages
- Integration with external forensic tools

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Ensure files are valid JSON format
   - Check file size limits
   - Verify backend is running on correct port

2. **Query Returns No Results**
   - Verify session ID is correct
   - Check if data was successfully uploaded
   - Ensure query is relevant to uploaded data

3. **Multilingual Issues**
   - Language detection is automatic but can be overridden
   - Ensure proper Unicode encoding in files
   - Check if language model supports the requested language

### Debug Information

Enable debug mode by checking the response `debug_info` field for detailed information about language detection and processing.
