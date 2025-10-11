# MongoDB Integration Setup Guide

## Overview

This guide will help you set up MongoDB for the UFDR Investigation Agent backend. MongoDB is used to store cases, sessions, analysis results, user data, and file metadata.

## Installation Options

### Option 1: MongoDB Community Edition (Local)

#### Windows Installation:

1. **Download MongoDB Community Server**

   - Visit: https://www.mongodb.com/try/download/community
   - Select Windows, Version 7.0+
   - Download the MSI installer

2. **Install MongoDB**

   - Run the installer
   - Choose "Complete" installation
   - Select "Install MongoDB as a Service"
   - Use default data directory: `C:\Program Files\MongoDB\Server\7.0\data`

3. **Verify Installation**

   ```powershell
   # Check if MongoDB service is running
   Get-Service mongodb

   # Test MongoDB connection
   mongosh
   ```

4. **MongoDB will run on**: `mongodb://localhost:27017`

### Option 2: MongoDB Atlas (Cloud - Free Tier)

1. **Create MongoDB Atlas Account**

   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free

2. **Create a Cluster**

   - Choose "Free Shared" tier (M0)
   - Select your preferred cloud provider and region
   - Name your cluster

3. **Configure Security**

   - Database Access: Create a user with password
   - Network Access: Add your IP address (or `0.0.0.0/0` for development)

4. **Get Connection String**

   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/ufdr_investigation`

5. **Update `.env` file**
   ```bash
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
   MONGODB_DB_NAME=ufdr_investigation
   ```

## Backend Setup

### 1. Install Python Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

This will install:

- `pymongo==4.6.1` - MongoDB Python driver
- `motor==3.3.2` - Async MongoDB driver for FastAPI

### 2. Configure Environment Variables

Edit `backend/.env`:

```bash
# For Local MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=ufdr_investigation

# For MongoDB Atlas (Cloud)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=ufdr_investigation

# OpenRouter API Key (existing)
OPENROUTER_API_KEY=your_api_key_here
```

### 3. Start the Backend Server

```powershell
cd backend
python main.py
```

The server will:

- Connect to MongoDB automatically on startup
- Create necessary indexes
- Display connection status in console

Expected output:

```
✅ Connected to MongoDB: ufdr_investigation
✅ Database indexes created successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Database Structure

The MongoDB database includes these collections:

### 1. **cases** - Case management

- Stores investigation cases
- Fields: case_id, title, description, status, priority, assigned_to, created_by, timestamps

### 2. **sessions** - Analysis sessions

- Links sessions to cases
- Fields: session_id, case_id, user_id, files_uploaded, timestamps

### 3. **users** - User accounts

- Stores user information and roles
- Fields: user_id, username, email, password_hash, role, timestamps

### 4. **analysis_results** - Analysis outputs

- Stores all analysis results (relationships, timelines, etc.)
- Fields: analysis_id, session_id, case_id, analysis_type, result_data

### 5. **relationships** - Relationship analyses

- Specialized storage for relationship network data
- Fields: relationship_id, session_id, case_id, people, relationships, summary

### 6. **file_metadata** - Uploaded files

- Tracks all uploaded files
- Fields: file_id, session_id, case_id, filename, file_type, file_size, chunks_count

### 7. **audit_logs** - Activity tracking

- Logs all user actions
- Fields: log_id, user_id, action, resource_type, resource_id, timestamp

## API Endpoints

### Case Management

#### Create Case

```bash
POST http://localhost:8000/cases/
Form Data:
  - title: "Case Title"
  - description: "Case Description"
  - case_number: "CASE-2024-001"
  - priority: "high"
  - created_by: "user_id"
```

#### List Cases

```bash
GET http://localhost:8000/cases/?status=active&limit=50
```

#### Get Case Details

```bash
GET http://localhost:8000/cases/{case_id}
```

#### Update Case

```bash
PUT http://localhost:8000/cases/{case_id}
Form Data:
  - title: "Updated Title"
  - status: "closed"
  - priority: "medium"
```

### Session Management

#### Create Session

```bash
POST http://localhost:8000/sessions/
Form Data:
  - session_id: "unique-session-id"
  - case_id: "case-uuid"
  - user_id: "user-id"
```

#### Get Session Details

```bash
GET http://localhost:8000/sessions/{session_id}
```

#### List Case Sessions

```bash
GET http://localhost:8000/cases/{case_id}/sessions
```

### File Upload (with MongoDB Integration)

```bash
POST http://localhost:8000/upload/
Form Data:
  - file: (UFDR file)
  - session_id: "session-id"
  - case_id: "case-id"  # Optional, enables MongoDB storage
```

### Relationship Analysis (with MongoDB Integration)

```bash
POST http://localhost:8000/analyze-relationships/
Form Data:
  - session_id: "session-id"
  - case_id: "case-id"  # Optional, enables MongoDB storage
```

## Testing MongoDB Connection

### Using Python

```python
from pymongo import MongoClient

# Test local connection
client = MongoClient("mongodb://localhost:27017")
db = client.ufdr_investigation
print("Collections:", db.list_collection_names())

# Test Atlas connection
client = MongoClient("mongodb+srv://username:password@cluster.mongodb.net/")
db = client.ufdr_investigation
print("Collections:", db.list_collection_names())
```

### Using MongoDB Shell (mongosh)

```bash
# Connect to local MongoDB
mongosh

# Or connect to Atlas
mongosh "mongodb+srv://cluster.mongodb.net/" --username your_username

# Show databases
show dbs

# Use the database
use ufdr_investigation

# Show collections
show collections

# Query cases
db.cases.find()

# Count documents
db.cases.countDocuments()
```

## Troubleshooting

### Connection Issues

**Problem**: `ServerSelectionTimeoutError`
**Solution**:

- Check if MongoDB service is running: `Get-Service mongodb`
- Start service: `Start-Service mongodb`
- Verify connection string in `.env`

**Problem**: Authentication failed (Atlas)
**Solution**:

- Check username/password in connection string
- Verify IP address is whitelisted in Atlas Network Access

### Import Errors

**Problem**: `ImportError: motor.motor_asyncio`
**Solution**:

```powershell
pip install motor pymongo
```

### Data Not Saving

**Problem**: Data uploads work but not saved to MongoDB
**Solution**:

- Ensure `case_id` is provided in the request
- Check console for MongoDB connection messages
- Verify database connection in logs

## Data Backup

### Backup MongoDB (Local)

```powershell
# Backup entire database
mongodump --db ufdr_investigation --out C:\Backups\mongodb\

# Restore database
mongorestore --db ufdr_investigation C:\Backups\mongodb\ufdr_investigation\
```

### Backup MongoDB Atlas

- Use MongoDB Atlas UI: Cluster → Backup tab
- Configure automated backups
- Or use mongodump with connection string

## Security Best Practices

1. **Production Environment**

   - Change default MongoDB port
   - Enable authentication
   - Use strong passwords
   - Implement role-based access control

2. **Connection String**

   - Never commit `.env` to git
   - Use environment variables in production
   - Rotate credentials regularly

3. **Network Security**
   - For local: Bind to localhost only
   - For Atlas: Whitelist specific IP addresses
   - Use VPC peering for production

## Additional Resources

- MongoDB Documentation: https://docs.mongodb.com/
- Motor (Async Driver): https://motor.readthedocs.io/
- PyMongo Guide: https://pymongo.readthedocs.io/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas

## Next Steps

1. Install MongoDB (local or Atlas)
2. Configure `.env` with connection string
3. Install Python dependencies
4. Start the backend server
5. Test API endpoints with MongoDB integration
6. Use frontend to create cases and upload files
