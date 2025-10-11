# 🚀 MongoDB Quick Start

## Installation (Choose One)

### Option 1: Local MongoDB (Windows)

```powershell
# Download from: https://www.mongodb.com/try/download/community
# Install and start service
Start-Service mongodb
```

### Option 2: Cloud (Free - MongoDB Atlas)

```
1. Sign up: https://www.mongodb.com/cloud/atlas/register
2. Create free M0 cluster
3. Get connection string
4. Update .env file
```

## Configuration

Edit `backend/.env`:

```bash
# Local
MONGODB_URL=mongodb://localhost:27017

# OR Cloud (Atlas)
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/

MONGODB_DB_NAME=ufdr_investigation
```

## Test Connection

```powershell
cd backend
python test_mongodb.py
```

Expected output:

```
✅ Successfully connected to MongoDB!
✅ Case created: TEST-2024-001
✅ ALL TESTS PASSED!
```

## Start Backend

```powershell
cd backend
python main.py
```

Look for:

```
✅ Connected to MongoDB: ufdr_investigation
✅ Database indexes created successfully
```

## Quick API Test

### 1. Create a Case

```bash
curl -X POST "http://localhost:8000/cases/" \
  -F "title=Test Case" \
  -F "case_number=CASE-001" \
  -F "priority=high" \
  -F "created_by=user1"
```

### 2. List Cases

```bash
curl "http://localhost:8000/cases/"
```

### 3. Create Session

```bash
curl -X POST "http://localhost:8000/sessions/" \
  -F "session_id=session-123" \
  -F "case_id=<from-step-1>" \
  -F "user_id=user1"
```

### 4. Upload File with MongoDB

```bash
curl -X POST "http://localhost:8000/upload/" \
  -F "file=@yourfile.ufdr" \
  -F "session_id=session-123" \
  -F "case_id=<from-step-1>"
```

## What's Working Now

✅ **Backend with MongoDB**

- Case management APIs
- Session tracking
- File metadata storage
- Analysis result storage
- Relationship mapping storage

✅ **Backward Compatible**

- Works without MongoDB
- Provide `case_id` to enable MongoDB features

## Common Issues

### Service not running:

```powershell
Start-Service mongodb
```

### Import errors:

```powershell
pip install pymongo motor
```

### Connection timeout:

- Check MongoDB is running
- Verify .env connection string
- Check firewall settings (Atlas)

## Full Documentation

- **MONGODB_SETUP_GUIDE.md** - Complete installation guide
- **MONGODB_API_EXAMPLES.md** - API examples with code
- **MONGODB_INTEGRATION_SUMMARY.md** - What was changed

## Need Help?

Check the detailed guides above or run:

```powershell
cd backend
python test_mongodb.py
```

This will tell you exactly what's wrong!
