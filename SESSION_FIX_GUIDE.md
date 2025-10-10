# Session Error Fix Guide

## Problem
You were getting the error: **"No session found for this case. Please ensure a UFDR file has been uploaded."**

## Root Cause
The frontend was using mock data instead of actually calling the backend API, which meant:
1. No real session ID was created
2. No data was actually uploaded to the backend
3. When trying to query, the backend couldn't find the session

## Solution Applied

### 1. **Fixed Frontend Upload Process**
- Updated `HomePage.jsx` to use real API calls instead of mock data
- Added support for both single and multiple file uploads
- Proper session ID handling from backend responses

### 2. **Enhanced File Uploader**
- Updated `FileUploader.jsx` to support multiple file selection
- Added support for `.ufdr` files
- Better file validation and error handling

### 3. **Backend API Integration**
- Frontend now properly calls the backend endpoints:
  - `/upload/` for UFDR files
  - `/upload-single-json/` for single JSON files
  - `/upload-multiple/` for multiple JSON files
  - `/query/` for AI queries

## How to Test the Fix

### Step 1: Start the Backend
```bash
cd raw-frontend/backend
python main.py
```
You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Step 2: Start the Frontend
```bash
cd YesIEdge
npm run dev
```
You should see:
```
Local:   http://localhost:5173/
```

### Step 3: Test Upload and Chat
1. Open http://localhost:5173/ in your browser
2. Upload one of your JSON files (calls.json, contacts.json, etc.)
3. Wait for the upload to complete
4. Try asking questions like:
   - "What information is available in this dataset?"
   - "Show me a summary of the data"
   - "What communication patterns exist?"

### Step 4: Verify with Test Script
```bash
cd raw-frontend/backend
python test_session_fix.py
```

## Expected Behavior After Fix

### ✅ **Working Upload**
- Files upload successfully to backend
- Real session IDs are created
- Data is processed and stored in vector database

### ✅ **Working Queries**
- AI responds with actual data from uploaded files
- No more "No session found" errors
- Multilingual support works properly

### ✅ **Multiple File Support**
- Can upload multiple JSON files at once
- Can upload UFDR files
- Cross-platform data correlation works

## Troubleshooting

### If you still get session errors:

1. **Check Backend Status**
   ```bash
   curl http://localhost:8000/
   ```
   Should return: `{"status": "healthy", "message": "UFDR Investigation Agent Backend is running"}`

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for any JavaScript errors
   - Check Network tab for failed API calls

3. **Verify File Upload**
   - Check browser Network tab during upload
   - Should see POST request to `/upload-single-json/` or `/upload-multiple/`
   - Response should contain valid `session_id`

4. **Check Backend Logs**
   - Look at backend console for error messages
   - Should see successful upload and chunk creation

### Common Issues:

1. **Backend Not Running**
   - Solution: Start backend with `python main.py`

2. **CORS Issues**
   - Solution: Backend already configured for localhost:5173

3. **File Too Large**
   - Solution: Use files under 100MB

4. **Invalid File Format**
   - Solution: Use .ufdr, .json, .csv, or .zip files only

## File Types Now Supported

- **calls.json** - Phone call records
- **contacts.json** - Contact information  
- **locations.json** - GPS location data
- **manifest.json** - Dataset metadata
- **WhatsApp chats** (WA_Chat_*.json) - Message history
- **Telegram chats** (TG_Chat_*.json) - Message history
- **UFDR files** (.ufdr) - Binary forensic data

## Next Steps

1. Test with your actual forensic data files
2. Try different types of queries
3. Test multilingual support (Hindi, Spanish, etc.)
4. Upload multiple files for cross-platform analysis

The session error should now be completely resolved! 🎉

