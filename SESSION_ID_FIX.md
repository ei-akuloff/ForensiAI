# Session ID Mismatch Fix

## Problem Identified

The forensic data (messenger timeline and call logs) was not displaying because of a **session ID mismatch** between upload and retrieval.

### Root Cause

1. **During Upload** (`dashboard/page.tsx`):

   - Session ID generated as: `case_${caseId}_${Date.now()}`
   - Example: `case_abc123_1728660169115`
   - Stored in MongoDB with this timestamp-based session_id

2. **During Display** (`case-timeline.tsx`):
   - Session ID hardcoded as: `case_${caseId}_session`
   - Example: `case_abc123_session`
   - Query used this wrong session_id, so no data found

### The Mismatch

```
Upload:   case_abc123_1728660169115  ← Data stored with this
Query:    case_abc123_session        ← Looking for this (wrong!)
```

## Solution Implemented

### Changed File: `src/components/case-timeline.tsx`

**Before:**

```typescript
const sessionId = `case_${caseId}_session`; // Hardcoded wrong format
```

**After:**

```typescript
// Get the actual session_id from localStorage (stored during upload)
const sessionId =
  typeof window !== "undefined"
    ? localStorage.getItem(`case_${caseId}_session`) || `case_${caseId}_session`
    : `case_${caseId}_session`;
```

Now the timeline component retrieves the **actual session_id** that was used during upload from localStorage (key: `case_${caseId}_session`).

## How to Test

### Step 1: Start Backend

```powershell
cd 'C:\Coding\SIH ''25\nidhibranch\raw-frontend\backend'
python main.py
```

Expected output:

```
✅ Connected to MongoDB
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Start Frontend

```powershell
cd 'C:\Coding\SIH ''25\nidhibranch\raw-frontend'
npm run dev
```

Expected output:

```
▲ Next.js 14.x.x
- Local:   http://localhost:3000
```

### Step 3: Upload chori.ufdr

1. Navigate to http://localhost:3000/dashboard
2. Click "Create New Case"
3. Fill in case details:
   - Case Name: "Robbery Case Test"
   - Case Type: "Criminal Investigation"
   - Priority: "High"
   - Status: "Active"
4. Upload `chori.ufdr` file
5. **Note the case ID** that gets created (e.g., "abc123")

### Step 4: Check Backend Logs

Look for these debug lines in the backend terminal:

```
[DEBUG] parse_all_forensic_data received keys: ['device_info', 'extraction_info', 'contacts', 'calls', 'messages', 'apps', 'case_id', 'case_theme', 'files']
[DEBUG] Has 'messages': True
[DEBUG] Has 'calls': True
[DEBUG] parse_messenger_data returned: 7 messages, 0 calls, 0 accounts
[DEBUG] parse_call_logs returned: 4 call logs
```

Expected counts for `chori.ufdr`:

- **7 messages**: 3 SMS (from `messages[]`) + 4 WhatsApp (from `apps[].groups[].messages[]`)
- **4 call logs**: From `calls[]` array
- **0 locations**: File has no `locations[]` array

### Step 5: Navigate to Case Detail Page

1. Click on the case from the dashboard
2. Navigate to the case detail page: `http://localhost:3000/cases/{caseId}`
3. Click "Timeline" tab

### Step 6: Verify Messenger Timeline

1. Click "Messenger Timeline" button
2. You should see **7 messages**:

**SMS Messages (3):**

- From: +15550001003 → To: +15550001001
  - "Blue van at the dock. Move at 02:00. —P"
  - Time: 2025-09-24 18:30:00 UTC
- From: +15550001002 → To: +15550001001
  - "Got it. Bring gloves. Beta will have the masks."
  - Time: 2025-09-24 19:05:00 UTC
- From: +15550001001 → To: +15550001003
  - "On my way. Park two blocks away."
  - Time: 2025-09-25 01:45:00 UTC

**WhatsApp Messages (4) - Group: "Night Ops":**

- From: +15550001003
  - "Plan: meet at the alley behind the warehouse. Codeword: 'Midnight Snack'."
  - Time: 2025-09-24 17:00:00 UTC
- From: +15550001002
  - "I have the van. Will be at Dock 7."
  - Time: 2025-09-24 17:05:30 UTC
- From: +15550001001
  - "All set. Watch for the trolley lights."
  - Time: 2025-09-25 01:50:10 UTC
- From: +15550001003
  - "Execute. Good luck."
  - Time: 2025-09-25 02:05:00 UTC

### Step 7: Verify Call Logs Timeline

1. Click "Call Logs" button
2. You should see **4 call logs** with contact names:

**Call 1:**

- From: **Planner** (+15550001003)
- To: null (outgoing)
- Type: Outgoing
- Duration: 45 seconds
- Time: 2025-09-24 18:00:00 UTC

**Call 2:**

- From: **Beta** (+15550001002)
- To: null (outgoing)
- Type: Outgoing
- Duration: 30 seconds
- Time: 2025-09-24 18:45:00 UTC

**Call 3:**

- From: **Alpha** (+15550001001)
- To: null (outgoing)
- Type: Outgoing
- Duration: 60 seconds
- Time: 2025-09-25 20:10:00 UTC

**Call 4:**

- From: **Shop Owner** (+15551234567)
- To: null (missed)
- Type: Missed
- Duration: 0 seconds
- Time: 2025-09-25 20:40:00 UTC

### Step 8: Verify MongoDB Data

Open MongoDB Compass or shell and run:

```javascript
use ufdr_investigation

// Check messenger messages
db.messenger_messages.find().count()  // Should return 7
db.messenger_messages.find({}, { sender: 1, receiver: 1, content: 1, timestamp: 1 }).pretty()

// Check call logs
db.call_logs.find().count()  // Should return 4
db.call_logs.find({}, { phone_number: 1, contact_name: 1, call_type: 1, duration_seconds: 1, timestamp: 1 }).pretty()

// Check session_id matches
db.messenger_messages.find({}, { session_id: 1 }).limit(1)
// The session_id should match: case_<caseId>_<timestamp>
```

## Troubleshooting

### Issue: Still seeing "No messenger data available"

**Check 1: Session ID**

- Open browser console (F12)
- Type: `localStorage.getItem('case_<yourCaseId>_session')`
- Verify it returns something like `case_abc123_1728660169115`

**Check 2: Backend Logs**

- Check backend terminal for debug output during upload
- Look for: `[DEBUG] parse_messenger_data returned: X messages`
- If X = 0, the parser is failing

**Check 3: MongoDB Data**

- Use MongoDB shell to verify data exists:
  ```javascript
  db.messenger_messages.find({ case_id: "<yourMongodbCaseId>" }).count();
  ```

**Check 4: API Request**

- Open browser Network tab (F12 → Network)
- Click "Messenger Timeline"
- Look for API request: `GET /forensic/messenger/<session_id>`
- Check if session_id in URL matches localStorage value

### Issue: Contact names not showing

The contacts array is being parsed, but names might not match. Check:

```javascript
// In MongoDB
db.call_logs.find({}, { phone_number: 1, contact_name: 1 });
```

If `contact_name` is null, the phone number lookup failed. Verify:

1. `contacts[]` array exists in JSON
2. `contacts[].number` matches `calls[].from`
3. Parser is building `contacts_map` correctly (line 230-236 of `forensic_parser.py`)

## What Was Fixed

### Files Modified

1. **`src/components/case-timeline.tsx`** (Line 138-141)
   - Changed from hardcoded `case_${caseId}_session`
   - To dynamic lookup from localStorage: `localStorage.getItem('case_${caseId}_session')`
   - Now retrieves the actual timestamp-based session_id

### Files NOT Changed (Already Correct)

1. **`src/app/dashboard/page.tsx`** (Line 111)

   - Already storing session_id in localStorage correctly
   - Key: `case_${newCaseId}_session`
   - Value: `case_${caseId}_${Date.now()}`

2. **`backend/forensic_parser.py`**

   - Already handles flat structure correctly
   - Already builds contacts_map for name lookup
   - Already parses `apps[].groups[].messages[]` for WhatsApp

3. **`backend/main.py`**
   - Already has multi-format parser integration
   - Already stores with correct session_id

## Expected Results

After this fix:
✅ Messenger Timeline shows 7 messages (3 SMS + 4 WhatsApp)
✅ Call Logs Timeline shows 4 calls with contact names
✅ Session IDs match between upload and query
✅ Data retrieved successfully from MongoDB

## Next Steps

If data still doesn't appear after this fix:

1. Delete the case from dashboard
2. Restart backend (to clear any cached imports)
3. Upload `chori.ufdr` again to create a fresh case
4. Check browser console for any React errors
5. Check backend logs for Python errors during parsing
