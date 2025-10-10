from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import tempfile
import os
import base64
import hashlib
import zipfile
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, Optional
from ufdr_parser import parse_ufdr, parse_json_data, chunk_text, extract_ufdr_contents, list_ufdr_contents
from vector_store import add_documents, get_full_context, delete_session
from openai import OpenAI
from dotenv import load_dotenv

# MongoDB imports
from database import connect_to_mongodb, close_mongodb_connection, get_database
from models import Case, Session, AnalysisResult, Relationship, FileMetadata, CaseStatus, CasePriority
import crud

try:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend
    CRYPTO_AVAILABLE = True
    print("Cryptography library loaded successfully")
except ImportError as e:
    print(f"Install cryptography: pip install cryptography. Error: {e}")
    CRYPTO_AVAILABLE = False

load_dotenv()

# Lifespan context manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongodb()
    yield
    # Shutdown
    await close_mongodb_connection()

def decrypt_ufdr_with_key(encrypted_data: bytes, key_base64: str, iv_base64: str) -> bytes:
    """
    Decrypt UFDR data using AES-CBC with PKCS7 padding.
    Based on the decrypt_and_verify_ufdr.py script.
    """
    if not CRYPTO_AVAILABLE:
        raise HTTPException(status_code=500, detail="Cryptography library not available")
    
    try:
        # Decode base64 key and IV
        key = base64.b64decode(key_base64)
        iv = base64.b64decode(iv_base64)
        
        # Create cipher
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        unpadder = padding.PKCS7(128).unpadder()
        
        # Decrypt and unpad
        decrypted_padded = decryptor.update(encrypted_data) + decryptor.finalize()
        decrypted = unpadder.update(decrypted_padded) + unpadder.finalize()
        
        return decrypted
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Decryption failed: {str(e)}")

def verify_sha256(data: bytes, expected_hash: str) -> bool:
    """
    Verify SHA-256 hash of decrypted data.
    """
    actual_hash = hashlib.sha256(data).hexdigest()
    return actual_hash.lower() == expected_hash.lower()

app = FastAPI(
    title="UFDR Investigation Agent Backend",
    lifespan=lifespan
)

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Support both React and Vite ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== UTILITY FUNCTIONS =====

def serialize_datetime(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert datetime objects in a dictionary to ISO format strings
    """
    if not isinstance(data, dict):
        return data
    
    for key, value in data.items():
        if isinstance(value, datetime):
            data[key] = value.isoformat()
        elif isinstance(value, dict):
            data[key] = serialize_datetime(value)
        elif isinstance(value, list):
            data[key] = [serialize_datetime(item) if isinstance(item, dict) else item for item in value]
    
    return data

@app.get("/")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "message": "UFDR Investigation Agent Backend is running"}


# ===== AUTHENTICATION ENDPOINTS =====

@app.post("/auth/signup")
async def signup(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    db = Depends(get_database)
):
    """
    Register a new user
    """
    try:
        # Check if user already exists
        existing_user = await crud.get_user_by_email(db, email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        existing_username = await crud.get_user_by_username(db, username)
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Hash password (basic hashing - use proper bcrypt in production)
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Create user
        from models import User, UserRole
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role=UserRole.ANALYST
        )
        
        created_user = await crud.create_user(db, user)
        
        # Remove password_hash from response
        created_user.pop('password_hash', None)
        
        # Convert datetime objects to ISO format strings
        created_user = serialize_datetime(created_user)
        
        return JSONResponse(content={
            "message": "User registered successfully",
            "user": created_user
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")


@app.post("/auth/login")
async def login(
    email: str = Form(...),
    password: str = Form(...),
    db = Depends(get_database)
):
    """
    Login user
    """
    try:
        # Get user
        user = await crud.get_user_by_email(db, email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password (basic verification - use proper bcrypt in production)
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        if user['password_hash'] != password_hash:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Update last login
        await crud.update_user_last_login(db, user['user_id'])
        
        # Remove password_hash from response
        user.pop('password_hash', None)
        
        # Convert datetime objects to ISO format strings
        user = serialize_datetime(user)
        
        return JSONResponse(content={
            "message": "Login successful",
            "user": user
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging in: {str(e)}")


# ===== MONGODB CASE MANAGEMENT ENDPOINTS =====

@app.post("/cases/")
async def create_new_case(
    title: str = Form(...),
    description: str = Form(None),
    case_number: str = Form(...),
    priority: str = Form("medium"),
    created_by: str = Form("default_user"),
    db = Depends(get_database)
):
    """
    Create a new case in MongoDB
    """
    try:
        case = Case(
            case_id=str(uuid.uuid4()),
            case_number=case_number,
            title=title,
            description=description,
            priority=CasePriority(priority),
            created_by=created_by
        )
        result = await crud.create_case(db, case)
        result = serialize_datetime(result)
        return JSONResponse(content={"message": "Case created successfully", "case": result})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating case: {str(e)}")


@app.get("/cases/")
async def list_cases(
    status: str = None,
    limit: int = 50,
    db = Depends(get_database)
):
    """
    List all cases with optional status filter
    """
    try:
        case_status = CaseStatus(status) if status else None
        cases = await crud.get_all_cases(db, status=case_status, limit=limit)
        cases = [serialize_datetime(case) for case in cases]
        return JSONResponse(content={"cases": cases, "count": len(cases)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cases: {str(e)}")


@app.get("/cases/{case_id}")
async def get_case_details(
    case_id: str,
    db = Depends(get_database)
):
    """
    Get detailed information about a specific case
    """
    try:
        case = await crud.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Also get sessions and files for this case
        sessions = await crud.get_sessions_by_case(db, case_id)
        files = await crud.get_files_by_case(db, case_id)
        analysis_results = await crud.get_analysis_results_by_case(db, case_id)
        
        # Serialize datetime objects
        case = serialize_datetime(case)
        sessions = [serialize_datetime(s) for s in sessions]
        files = [serialize_datetime(f) for f in files]
        analysis_results = [serialize_datetime(a) for a in analysis_results]
        
        return JSONResponse(content={
            "case": case,
            "sessions": sessions,
            "files": files,
            "analysis_results": analysis_results
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching case: {str(e)}")


@app.put("/cases/{case_id}")
async def update_case_details(
    case_id: str,
    title: str = Form(None),
    description: str = Form(None),
    status: str = Form(None),
    priority: str = Form(None),
    db = Depends(get_database)
):
    """
    Update case details
    """
    try:
        updates = {}
        if title:
            updates["title"] = title
        if description:
            updates["description"] = description
        if status:
            updates["status"] = CaseStatus(status)
        if priority:
            updates["priority"] = CasePriority(priority)
        
        success = await crud.update_case(db, case_id, updates)
        if not success:
            raise HTTPException(status_code=404, detail="Case not found")
        
        return JSONResponse(content={"message": "Case updated successfully"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating case: {str(e)}")


# ===== SESSION MANAGEMENT ENDPOINTS =====

@app.post("/sessions/")
async def create_new_session(
    session_id: str = Form(...),
    case_id: str = Form(...),
    user_id: str = Form("default_user"),
    db = Depends(get_database)
):
    """
    Create a new analysis session linked to a case
    """
    try:
        session = Session(
            session_id=session_id,
            case_id=case_id,
            user_id=user_id
        )
        result = await crud.create_session(db, session)
        result = serialize_datetime(result)
        return JSONResponse(content={"message": "Session created successfully", "session": result})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")


@app.get("/sessions/{session_id}")
async def get_session_details(
    session_id: str,
    db = Depends(get_database)
):
    """
    Get session details
    """
    try:
        session = await crud.get_session_by_id(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        session = serialize_datetime(session)
        return JSONResponse(content={"session": session})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching session: {str(e)}")


@app.get("/cases/{case_id}/sessions")
async def get_case_sessions(
    case_id: str,
    db = Depends(get_database)
):
    """
    Get all sessions for a case
    """
    try:
        sessions = await crud.get_sessions_by_case(db, case_id)
        sessions = [serialize_datetime(s) for s in sessions]
        return JSONResponse(content={"sessions": sessions, "count": len(sessions)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sessions: {str(e)}")

def get_client():
    """
    Lazy load OpenAI client for OpenRouter.
    """
    from openai import OpenAI
    import os
    return OpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
    )

def parse_json_safely(text: str):
    """
    Try to parse LLM output to JSON robustly:
    - Strip code fences
    - Trim to the outermost JSON object/array if possible
    """
    if not text:
        return None
    candidate = text.strip()
    # Remove Markdown code fences if present
    if candidate.startswith("```"):
        candidate = candidate.strip('`')
        # In case language tag present, split first newline
        if "\n" in candidate:
            candidate = candidate.split("\n", 1)[1]
    # Find first '{' or '[' and last '}' or ']'
    start_obj = candidate.find('{')
    start_arr = candidate.find('[')
    starts = [i for i in [start_obj, start_arr] if i != -1]
    if not starts:
        # Nothing that looks like JSON
        return None
    start = min(starts)
    end_obj = candidate.rfind('}')
    end_arr = candidate.rfind(']')
    end_candidates = [i for i in [end_obj, end_arr] if i != -1]
    if not end_candidates:
        return None
    end = max(end_candidates) + 1
    sliced = candidate[start:end]
    try:
        return json.loads(sliced)
    except Exception:
        return None

@app.post("/upload/")
async def upload_ufdr(
    session_id: str = Form(...), 
    file: UploadFile = File(...),
    case_id: str = Form(None),
    db = Depends(get_database)
):
    """
    Upload UFDR file, extract JSON contents, parse them, chunk the text, and store in vector database.
    Also saves metadata to MongoDB.
    """
    if not file.filename.endswith('.ufdr') and not file.filename.endswith('.ufdr.enc'):
        raise HTTPException(status_code=400, detail="File must be a .ufdr or .ufdr.enc file")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.ufdr') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    print(f"Temp file created: {tmp_path}")
    
    try:
        # Extract and parse JSON contents from UFDR file
        print("Starting extract_ufdr_contents...")
        text = extract_ufdr_contents(tmp_path)
        print(f"Extracted text length: {len(text)}")
        
        # Chunk the text
        print("Starting chunk_text...")
        chunks = chunk_text(text)
        print(f"Created {len(chunks)} chunks")
        
        # Reset prior context for this session and add chunks
        delete_session(session_id)
        if chunks:
            print("Starting add_documents...")
            add_documents(chunks, session_id=session_id)
            print("add_documents completed")
        else:
            print("No chunks generated; skipping add_documents.")
        
        # Save file metadata to MongoDB if case_id is provided
        if case_id is not None:
            try:
                file_metadata = FileMetadata(
                    session_id=session_id,
                    case_id=case_id,
                    filename=file.filename,
                    file_type="ufdr",
                    file_size=len(content),
                    processed=True,
                    chunks_count=len(chunks)
                )
                await crud.create_file_metadata(db, file_metadata)
                
                # Update session with file info
                await crud.add_file_to_session(db, session_id, {
                    "filename": file.filename,
                    "file_type": "ufdr",
                    "upload_time": datetime.utcnow().isoformat(),
                    "chunks": len(chunks)
                })
                print("File metadata saved to MongoDB")
                
                # Automatically trigger forensic parsing after successful upload
                try:
                    print(f"Starting automatic forensic parsing for session: {session_id}")
                    import forensic_parser
                    
                    # Get the uploaded file metadata to extract JSON
                    forensic_data = forensic_parser.parse_all_forensic_data(text)
                    
                    if forensic_data:
                        # Store messenger data
                        if forensic_data["messenger_messages"]:
                            msg_ids = await crud.bulk_create_messenger_messages(
                                db, forensic_data["messenger_messages"], session_id, case_id
                            )
                            print(f"Stored {len(msg_ids)} messenger messages")
                        
                        if forensic_data["messenger_calls"]:
                            call_ids = await crud.bulk_create_messenger_calls(
                                db, forensic_data["messenger_calls"], session_id, case_id
                            )
                            print(f"Stored {len(call_ids)} messenger calls")
                        
                        if forensic_data["messenger_accounts"]:
                            account_ids = await crud.bulk_create_messenger_accounts(
                                db, forensic_data["messenger_accounts"], session_id, case_id
                            )
                            print(f"Stored {len(account_ids)} messenger accounts")
                        
                        # Store call logs
                        if forensic_data["call_logs"]:
                            call_log_ids = await crud.bulk_create_call_logs(
                                db, forensic_data["call_logs"], session_id, case_id
                            )
                            print(f"Stored {len(call_log_ids)} call logs")
                        
                        # Store Find My locations
                        if forensic_data["find_my_locations"]:
                            location_ids = await crud.bulk_create_find_my_locations(
                                db, forensic_data["find_my_locations"], session_id, case_id
                            )
                            print(f"Stored {len(location_ids)} Find My locations")
                        
                        # Generate and store forensic summary
                        summary = forensic_parser.extract_forensic_summary(forensic_data)
                        if summary:
                            summary["session_id"] = session_id
                            summary["case_id"] = case_id
                            summary_id = await crud.create_forensic_summary(db, summary)
                            print(f"Stored forensic summary with ID: {summary_id}")
                        
                        print("Automatic forensic parsing completed successfully")
                except Exception as forensic_error:
                    print(f"Warning: Automatic forensic parsing failed: {str(forensic_error)}")
                    import traceback
                    traceback.print_exc()
                    # Don't fail the upload if forensic parsing fails
                
            except Exception as mongo_error:
                print(f"Warning: Could not save to MongoDB: {str(mongo_error)}")
        
        saved_to_db = case_id is not None
        return JSONResponse(content={
            "message": "UFDR file processed and stored successfully", 
            "chunks": len(chunks), 
            "session_id": session_id,
            "saved_to_db": saved_to_db
        })
    
    except Exception as e:
        print(f"Upload error details: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    
    finally:
        # Clean up temp file
        os.unlink(tmp_path)

@app.post("/upload-encrypted-ufdr/")
async def upload_encrypted_ufdr(
    session_id: str = Form(...), 
    file: UploadFile = File(...),
    decryption_key: str = Form(None),
    hash_value: str = Form(None)
):
    """
    Upload encrypted UFDR file, decrypt it, extract JSON contents, parse them, chunk the text, and store in vector database.
    """
    if not file.filename.endswith('.ufdr.enc'):
        raise HTTPException(status_code=400, detail="File must be a .ufdr.enc file")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.ufdr.enc') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    print(f"Temp encrypted file created: {tmp_path}")
    
    try:
        print("Starting decryption process...")
        
        # Parse decryption key JSON if provided
        key_base64 = None
        iv_base64 = None
        if decryption_key and decryption_key.strip():
            try:
                key_data = json.loads(decryption_key)
                key_base64 = key_data["key_base64"]
                iv_base64 = key_data["iv_base64"]
            except (json.JSONDecodeError, KeyError) as e:
                raise HTTPException(status_code=400, detail=f"Invalid decryption key format: {str(e)}")
        
        # Read encrypted data
        with open(tmp_path, 'rb') as f:
            encrypted_data = f.read()
        
        # Decrypt the data if key is provided, otherwise treat as regular UFDR
        if key_base64 and iv_base64:
            print(f"🔓 DECRYPTING: Using key {key_base64[:20]}... and IV {iv_base64[:20]}...")
            decrypted_data = decrypt_ufdr_with_key(encrypted_data, key_base64, iv_base64)
            print(f"✅ DECRYPTION SUCCESS: {len(decrypted_data)} bytes decrypted")
        else:
            # No key provided - treat as regular UFDR file
            print("⚠️  NO DECRYPTION KEY: Treating as regular UFDR file (NOT DECRYPTED)")
            decrypted_data = encrypted_data
        
        # Verify hash if provided
        hash_verified = False
        if hash_value:
            hash_verified = verify_sha256(decrypted_data, hash_value)
            if not hash_verified:
                print(f"⚠️  HASH VERIFICATION FAILED: Expected {hash_value}, got {hashlib.sha256(decrypted_data).hexdigest()}")
                print("⚠️  Continuing without hash verification...")
                # Don't fail the upload, just log the warning
                # raise HTTPException(status_code=400, detail="SHA-256 hash verification failed")
        
        # Save decrypted data to temporary file
        decrypted_path = tmp_path.replace('.ufdr.enc', '.ufdr')
        with open(decrypted_path, 'wb') as f:
            f.write(decrypted_data)
        
        print(f"Decrypted file created: {decrypted_path}")
        
        # Extract and parse JSON contents from decrypted UFDR file
        print("🔍 EXTRACTING: Starting extract_ufdr_contents from decrypted file...")
        text = extract_ufdr_contents(decrypted_path)
        print(f"📄 EXTRACTED: {len(text)} characters from decrypted UFDR")
        print(f"📝 SAMPLE TEXT: {text[:200]}...")
        
        # Chunk the text
        print("Starting chunk_text...")
        chunks = chunk_text(text)
        print(f"Created {len(chunks)} chunks")
        
        # Reset prior context for this session and add chunks
        delete_session(session_id)
        if chunks:
            print("Starting add_documents...")
            add_documents(chunks, session_id=session_id)
            print("add_documents completed")
        else:
            print("No chunks generated; skipping add_documents.")
        
        return JSONResponse(content={
            "message": "UFDR file processed successfully", 
            "chunks": len(chunks), 
            "session_id": session_id,
            "decryption_used": bool(key_base64 and iv_base64),
            "hash_verified": hash_verified
        })
    
    except Exception as e:
        print(f"Encrypted upload error details: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing encrypted file: {str(e)}")
    
    finally:
        # Clean up temp files
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        decrypted_path = tmp_path.replace('.ufdr.enc', '.ufdr')
        if os.path.exists(decrypted_path):
            os.unlink(decrypted_path)

@app.post("/list-ufdr-contents/")
async def list_ufdr_file_contents(file: UploadFile = File(...)):
    """
    List all JSON files contained in a UFDR file without processing them.
    """
    if not file.filename.endswith('.ufdr'):
        raise HTTPException(status_code=400, detail="File must be a .ufdr file")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.ufdr') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    print(f"Listing contents of: {tmp_path}")
    
    try:
        # List contents of UFDR file
        print("Starting list_ufdr_contents...")
        files_info = list_ufdr_contents(tmp_path)
        print(f"Found {len(files_info)} files")
        
        return JSONResponse(content={
            "message": f"Found {len(files_info)} files in UFDR archive",
            "files": files_info,
            "total_files": len(files_info)
        })
    
    except Exception as e:
        print(f"List contents error details: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error listing file contents: {str(e)}")
    
    finally:
        # Clean up temp file
        os.unlink(tmp_path)

@app.post("/upload-multiple/")
async def upload_multiple_files(session_id: str = Form(...), files: list[UploadFile] = File(...)):
    """
    Upload multiple JSON files (calls, contacts, locations, manifest, WhatsApp/Telegram chats),
    parse them, chunk the text, and store in vector database.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Validate file types
    supported_extensions = ['.json']
    temp_files = []
    total_chunks = 0
    
    try:
        # Reset prior context for this session
        delete_session(session_id)
        
        for file in files:
            if not file.filename.lower().endswith('.json'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} must be a .json file")
            
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp_file:
                content = await file.read()
                tmp_file.write(content)
                tmp_path = tmp_file.name
                temp_files.append(tmp_path)
            
            print(f"Processing file: {file.filename}")
            
            # Parse the JSON file
            text = parse_json_data(tmp_path)
            print(f"Parsed text length for {file.filename}: {len(text)}")
            
            # Chunk the text
            chunks = chunk_text(text)
            print(f"Created {len(chunks)} chunks for {file.filename}")
            
            # Add chunks with metadata indicating file type
            if chunks:
                file_metadata = [{"source": "json_file", "filename": file.filename, "session_id": session_id} for _ in chunks]
                add_documents(chunks, session_id=session_id, metadatas=file_metadata)
                total_chunks += len(chunks)
        
        return JSONResponse(content={
            "message": f"Successfully processed {len(files)} JSON files", 
            "total_chunks": total_chunks, 
            "session_id": session_id,
            "files_processed": [f.filename for f in files]
        })
    
    except Exception as e:
        print(f"Upload error details: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")
    
    finally:
        # Clean up temp files
        for tmp_path in temp_files:
            try:
                os.unlink(tmp_path)
            except:
                pass

@app.post("/upload-single-json/")
async def upload_single_json(session_id: str = Form(...), file: UploadFile = File(...)):
    """
    Upload a single JSON file (calls, contacts, locations, manifest, WhatsApp/Telegram chat),
    parse it, chunk the text, and store in vector database.
    """
    if not file.filename.lower().endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be a .json file")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    print(f"Temp file created: {tmp_path}")
    
    try:
        # Parse the JSON file
        print(f"Starting parse_json_data for {file.filename}...")
        text = parse_json_data(tmp_path)
        print(f"Parsed text length: {len(text)}")
        
        # Chunk the text
        print("Starting chunk_text...")
        chunks = chunk_text(text)
        print(f"Created {len(chunks)} chunks")
        
        # Add chunks with metadata
        if chunks:
            file_metadata = [{"source": "json_file", "filename": file.filename, "session_id": session_id} for _ in chunks]
            add_documents(chunks, session_id=session_id, metadatas=file_metadata)
            print("add_documents completed")
        else:
            print("No chunks generated; skipping add_documents.")
        
        return JSONResponse(content={
            "message": f"JSON file {file.filename} processed and stored successfully", 
            "chunks": len(chunks), 
            "session_id": session_id,
            "file_type": file.filename
        })
    
    except Exception as e:
        print(f"Upload error details: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    
    finally:
        # Clean up temp file
        os.unlink(tmp_path)

@app.post("/analyze-relationships/")
async def analyze_relationships(
    session_id: str = Form(...),
    case_id: str = Form(None),
    db = Depends(get_database)
):
    """
    Analyze relationships between people in the UFDR data using LLM.
    Saves results to MongoDB.
    """
    try:
        # Get all context from the session
        context = get_full_context("", session_id)
        
        if not context:
            return JSONResponse(content={
                "message": "No data found for this session",
                "relationships": [],
                "people": []
            })
        
        # Enhanced prompt for relationship analysis
        prompt = f"""You are an expert forensic analyst specializing in relationship mapping and social network analysis.

Analyze the following forensic data to identify:
1. PEOPLE: All individuals mentioned (names, phone numbers, contacts)
2. RELATIONSHIPS: How these people are connected to each other
3. CONNECTION TYPES: Family, friends, business, suspicious, etc.
4. COMMUNICATION PATTERNS: Frequency and nature of interactions

Return your analysis as a JSON object with this exact structure:
{{
    "people": [
        {{
            "id": "unique_id",
            "name": "Person Name",
            "phone": "phone_number",
            "type": "contact|caller|chat_participant",
            "frequency": "high|medium|low",
            "suspicious": true/false
        }}
    ],
    "relationships": [
        {{
            "from": "person_id_1",
            "to": "person_id_2", 
            "type": "family|friend|business|suspicious|unknown",
            "strength": "strong|medium|weak",
            "evidence": "description of how they're connected",
            "communication_count": number,
            "last_interaction": "date if available"
        }}
    ],
    "summary": "Brief analysis of the relationship network"
}}

IMPORTANT RULES:
- Only include people who appear multiple times or have significant connections
- Be conservative - only mark as suspicious if there's clear evidence
- Use phone numbers as unique identifiers when names aren't available
- Focus on meaningful relationships, not casual mentions

Forensic Data:
{context[:8000]}  # Limit context to avoid token limits

Your JSON analysis:"""

        # Query LLM for relationship analysis
        client = get_client()
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a forensic relationship analyst. Always respond with valid JSON only. No additional text or explanations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.1
        )
        
        analysis_text = response.choices[0].message.content.strip()
        
        # Parse the JSON response
        try:
            analysis = json.loads(analysis_text)
            print(f"PARSED: {len(analysis.get('people', []))} people, {len(analysis.get('relationships', []))} relationships")
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {e}")
            print(f"Raw response: {analysis_text[:500]}...")
            # Fallback if JSON parsing fails
            analysis = {
                "people": [],
                "relationships": [],
                "summary": "Analysis completed but could not parse results properly"
            }
        
        # Save to MongoDB if case_id is provided
        if case_id is not None:
            try:
                relationship = Relationship(
                    session_id=session_id,
                    case_id=case_id,
                    people=analysis.get("people", []),
                    relationships=analysis.get("relationships", []),
                    summary=analysis.get("summary", "")
                )
                await crud.create_relationship_analysis(db, relationship)
                
                # Also save as generic analysis result
                analysis_result = AnalysisResult(
                    session_id=session_id,
                    case_id=case_id,
                    analysis_type="relationship",
                    result_data=analysis
                )
                await crud.create_analysis_result(db, analysis_result)
                print("Relationship analysis saved to MongoDB")
            except Exception as mongo_error:
                print(f"Warning: Could not save to MongoDB: {str(mongo_error)}")
        
        saved_to_db = case_id is not None
        return JSONResponse(content={
            "message": "Relationship analysis completed",
            "session_id": session_id,
            "analysis": analysis,
            "saved_to_db": saved_to_db
        })
    
    except Exception as e:
        print(f"Relationship analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return JSONResponse(content={
            "message": f"Error analyzing relationships: {str(e)}",
            "session_id": session_id,
            "analysis": {
                "people": [],
                "relationships": [],
                "summary": "Analysis failed"
            }
        })

@app.post("/get-relationship-communications/")
async def get_relationship_communications(
    session_id: str = Form(...),
    person1_id: str = Form(...),
    person2_id: str = Form(...)
):
    """
    Get actual communications between two specific people using LLM analysis.
    """
    try:
        # Get all context from the session
        context = get_full_context("", session_id)
        
        if not context:
            return JSONResponse(content={
                "message": "No data found for this session",
                "communications": []
            })
        
        # Enhanced prompt for communication extraction
        prompt = f"""You are an expert forensic analyst. Extract actual communication data between two specific people from the following forensic data.

PERSON 1 ID: {person1_id}
PERSON 2 ID: {person2_id}

Analyze the data and extract:
1. All messages, calls, and communications between these two people
2. Timestamps when available
3. Communication type (WhatsApp, SMS, Call, etc.)
4. Message content (actual text)
5. Suspicious or notable content

Return as JSON with this exact structure:
{{
    "communications": [
        {{
            "type": "whatsapp|sms|call|email",
            "timestamp": "date/time if available",
            "content": "actual message content",
            "direction": "sent|received",
            "suspicious": true/false,
            "platform": "WhatsApp|SMS|Phone|Email"
        }}
    ],
    "summary": "Brief summary of communication patterns"
}}

Forensic Data:
{context[:8000]}"""

        print(f"ANALYZING: Communications between {person1_id} and {person2_id}")
        
        # Call OpenAI API
        client = get_client()
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        
        llm_response = response.choices[0].message.content
        print(f"LLM RESPONSE: {llm_response[:200]}...")
        
        # Parse JSON response
        try:
            analysis_data = json.loads(llm_response)
            print(f"PARSED: Communications data extracted successfully")
            return JSONResponse(content=analysis_data)
        except json.JSONDecodeError as e:
            print(f"JSON PARSE ERROR: {str(e)}")
            print(f"Raw response: {llm_response}")
            # Fallback: attempt to strip code fences / slice outer JSON
            safe = parse_json_safely(llm_response)
            if safe is not None:
                print("Parsed via safe JSON fallback")
                return JSONResponse(content=safe)
            # Return a fallback structure
            return JSONResponse(content={
                "communications": [],
                "summary": "Unable to parse communication data"
            })
    
    except Exception as e:
        print(f"Communication extraction error: {str(e)}")
        return JSONResponse(content={
            "message": f"Error extracting communications: {str(e)}",
            "communications": []
        }, status_code=500)

@app.post("/query/")
async def query_documents(query: str = Form(...), session_id: str = Form(...), language: str = Form(None)):
    """
    Query the vector store for relevant context and generate response using LLM.
    """
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        # Retrieve relevant context from vector store
        context = get_full_context(query, session_id)
        
        if not context:
            return JSONResponse(content={"response": "No relevant information found in the documents."})
        
        # Enhanced multilingual support with auto-detection and explicit language handling
        lang_instruction = "IMPORTANT: You MUST respond in English only. Use proper English grammar, vocabulary, and sentence structure. Do not use any other languages."
        detected_language = None
        
        if language:
            # Explicit language parameter provided
            language_lower = language.lower()
            if language_lower in ["en", "english", "eng"]:
                lang_instruction = "IMPORTANT: You MUST respond in English only. Use proper English grammar, vocabulary, and sentence structure. Do not use any other languages."
                detected_language = "English"
            elif language_lower in ["hi", "hindi", "हिंदी"]:
                lang_instruction = "IMPORTANT: You MUST respond in Hindi (Devanagari script). Use proper Hindi grammar and vocabulary. Do not use English."
                detected_language = "Hindi"
            elif language_lower in ["hinglish", "hi-en", "mixed"]:
                lang_instruction = "IMPORTANT: You MUST respond in Hinglish (mix of Hindi and English in Roman script). Use a natural mix of Hindi and English words."
                detected_language = "Hinglish"
            elif language_lower in ["mr", "marathi", "मराठी"]:
                lang_instruction = "IMPORTANT: You MUST respond in Marathi (Devanagari script). Use proper Marathi grammar and vocabulary."
                detected_language = "Marathi"
            elif language_lower in ["gu", "gujarati", "ગુજરાતી"]:
                lang_instruction = "IMPORTANT: You MUST respond in Gujarati (Gujarati script). Use proper Gujarati grammar and vocabulary."
                detected_language = "Gujarati"
            elif language_lower in ["es", "spanish", "español"]:
                lang_instruction = "IMPORTANT: You MUST respond in Spanish (Español). Use proper Spanish grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "Spanish"
            elif language_lower in ["fr", "french", "français"]:
                lang_instruction = "IMPORTANT: You MUST respond in French (Français). Use proper French grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "French"
            elif language_lower in ["de", "german", "deutsch"]:
                lang_instruction = "IMPORTANT: You MUST respond in German (Deutsch). Use proper German grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "German"
            elif language_lower in ["ta", "tamil", "தமிழ்"]:
                lang_instruction = "IMPORTANT: You MUST respond in Tamil (Tamil script). Use proper Tamil grammar and vocabulary."
                detected_language = "Tamil"
            elif language_lower in ["te", "telugu", "తెలుగు"]:
                lang_instruction = "IMPORTANT: You MUST respond in Telugu (Telugu script). Use proper Telugu grammar and vocabulary."
                detected_language = "Telugu"
            elif language_lower in ["bn", "bengali", "বাংলা"]:
                lang_instruction = "IMPORTANT: You MUST respond in Bengali (Bengali script). Use proper Bengali grammar and vocabulary."
                detected_language = "Bengali"
            elif language_lower in ["kn", "kannada", "ಕನ್ನಡ"]:
                lang_instruction = "IMPORTANT: You MUST respond in Kannada (Kannada script). Use proper Kannada grammar and vocabulary."
                detected_language = "Kannada"
            elif language_lower in ["ml", "malayalam", "മലയാളം"]:
                lang_instruction = "IMPORTANT: You MUST respond in Malayalam (Malayalam script). Use proper Malayalam grammar and vocabulary."
                detected_language = "Malayalam"
            elif language_lower in ["pa", "punjabi", "ਪੰਜਾਬੀ"]:
                lang_instruction = "IMPORTANT: You MUST respond in Punjabi (Gurmukhi script). Use proper Punjabi grammar and vocabulary."
                detected_language = "Punjabi"
            elif language_lower in ["zh", "chinese", "中文", "中国话"]:
                lang_instruction = "IMPORTANT: You MUST respond in Chinese (中文). Use proper Chinese grammar and vocabulary."
                detected_language = "Chinese"
        else:
            # Auto-detect language from query content
            if any('\u0900' <= ch <= '\u097F' for ch in query):  # Devanagari (Hindi/Marathi)
                if any(word in query.lower() for word in ['मराठी', 'marathi', 'maharashtra']):
                    lang_instruction = "IMPORTANT: You MUST respond in Marathi (Devanagari script). Use proper Marathi grammar and vocabulary."
                    detected_language = "Marathi (auto-detected)"
                else:
                    lang_instruction = "IMPORTANT: You MUST respond in Hindi (Devanagari script). Use proper Hindi grammar and vocabulary."
                    detected_language = "Hindi (auto-detected)"
            elif any('\u0A80' <= ch <= '\u0AFF' for ch in query):  # Gujarati
                lang_instruction = "IMPORTANT: You MUST respond in Gujarati (Gujarati script). Use proper Gujarati grammar and vocabulary."
                detected_language = "Gujarati (auto-detected)"
            elif any('\u0B80' <= ch <= '\u0BFF' for ch in query):  # Tamil
                lang_instruction = "IMPORTANT: You MUST respond in Tamil (Tamil script). Use proper Tamil grammar and vocabulary."
                detected_language = "Tamil (auto-detected)"
            elif any('\u0C00' <= ch <= '\u0C7F' for ch in query):  # Telugu
                lang_instruction = "IMPORTANT: You MUST respond in Telugu (Telugu script). Use proper Telugu grammar and vocabulary."
                detected_language = "Telugu (auto-detected)"
            elif any('\u0980' <= ch <= '\u09FF' for ch in query):  # Bengali
                lang_instruction = "IMPORTANT: You MUST respond in Bengali (Bengali script). Use proper Bengali grammar and vocabulary."
                detected_language = "Bengali (auto-detected)"
            elif any('\u0C80' <= ch <= '\u0CFF' for ch in query):  # Kannada
                lang_instruction = "IMPORTANT: You MUST respond in Kannada (Kannada script). Use proper Kannada grammar and vocabulary."
                detected_language = "Kannada (auto-detected)"
            elif any('\u0D00' <= ch <= '\u0D7F' for ch in query):  # Malayalam
                lang_instruction = "IMPORTANT: You MUST respond in Malayalam (Malayalam script). Use proper Malayalam grammar and vocabulary."
                detected_language = "Malayalam (auto-detected)"
            elif any('\u0A00' <= ch <= '\u0A7F' for ch in query):  # Gurmukhi (Punjabi)
                lang_instruction = "IMPORTANT: You MUST respond in Punjabi (Gurmukhi script). Use proper Punjabi grammar and vocabulary."
                detected_language = "Punjabi (auto-detected)"
            # Check for Hinglish patterns (mix of English and romanized Hindi)
            elif any(word in query.lower() for word in ['hai', 'hain', 'kar', 'kya', 'aur', 'main', 'mein', 'tum', 'tumhara', 'mera', 'tera', 'uska', 'kaise', 'kahan', 'kyun', 'abhi', 'phir', 'chor', 'kon', 'koi', 'yeh', 'woh', 'isko', 'usko', 'dekho', 'suno', 'bolo', 'batao', 'dikhao', 'karo', 'kijiye']):
                lang_instruction = "IMPORTANT: You MUST respond in Hinglish (mix of Hindi and English in Roman script). Use a natural mix of Hindi and English words like 'chor kon hai', 'kya pata', 'yeh dekho', etc."
                detected_language = "Hinglish (auto-detected)"
            # Check for Spanish patterns
            elif any(word in query.lower() for word in ['qué', 'que', 'cómo', 'como', 'dónde', 'donde', 'cuándo', 'cuando', 'por qué', 'porque', 'esta', 'este', 'son', 'es', 'archivo', 'archivos', 'encontrar', 'mostrar', 'información']):
                lang_instruction = "IMPORTANT: You MUST respond in Spanish (Español). Use proper Spanish grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "Spanish (auto-detected)"
            # Check for French patterns
            elif any(word in query.lower() for word in ['que', 'qui', 'quoi', 'comment', 'où', 'quand', 'pourquoi', 'parce', 'cette', 'ces', 'sont', 'est', 'fichier', 'fichiers', 'trouver', 'montrer', 'information', 'données']):
                lang_instruction = "IMPORTANT: You MUST respond in French (Français). Use proper French grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "French (auto-detected)"
            # Check for German patterns
            elif any(word in query.lower() for word in ['was', 'wie', 'wo', 'wann', 'warum', 'weil', 'diese', 'dieser', 'sind', 'ist', 'datei', 'dateien', 'finden', 'zeigen', 'information', 'daten']):
                lang_instruction = "IMPORTANT: You MUST respond in German (Deutsch). Use proper German grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "German (auto-detected)"
            # Check for Chinese patterns (Simplified & Traditional)
            elif any('\u4e00' <= ch <= '\u9fff' for ch in query):  # Chinese characters
                lang_instruction = "IMPORTANT: You MUST respond in Chinese (中文). Use proper Chinese grammar and vocabulary."
                detected_language = "Chinese (auto-detected)"

        # Enhanced prompt with multilingual forensic context
        prompt = f"""You are an advanced AI assistant specialized in digital forensics investigation with comprehensive multilingual capabilities.

CRITICAL LANGUAGE REQUIREMENT: {lang_instruction}

🔴 ABSOLUTE MANDATORY RULE: You MUST respond ONLY in the specified language. This is NON-NEGOTIABLE:
- If user asks in Hinglish (like "chor kon hai?"), respond in Hinglish (like "UFDR context mein 'chor' ka koi specific mention nahi hai...")
- If user asks in Hindi, respond in Hindi
- If user asks in French, respond in French  
- If user asks in German, respond in German
- If user asks in Chinese, respond in Chinese

⚠️ WARNING: DO NOT RESPOND IN ENGLISH unless the query is in English. Match the user's language EXACTLY.

MULTILINGUAL UFDR ANALYSIS CAPABILITIES:
You can analyze and understand content in multiple scripts and languages including:
- Indian Languages: Hindi (हिंदी), Marathi (मराठी), Gujarati (ગુજરાતી), Tamil (தமிழ்), Telugu (తెలుగు), Bengali (বাংলা), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), and Hinglish
- International Languages: English, Spanish (Español), French (Français), German (Deutsch), Chinese (中文)

FORENSIC DATA TYPES YOU CAN ANALYZE:
1. CALL RECORDS: Phone calls with timestamps, participants, duration, type (incoming/outgoing/missed)
2. CONTACT RECORDS: Contact information including names, phone numbers, user IDs
3. LOCATION RECORDS: GPS coordinates with timestamps for tracking movement patterns
4. MANIFEST DATA: Overview of the entire dataset including file counts and metadata
5. WHATSAPP CHATS: Messages, participants, timestamps, attachments from WhatsApp conversations
6. TELEGRAM CHATS: Messages, participants, timestamps, attachments from Telegram conversations

FORENSIC ANALYSIS INSTRUCTIONS:
1. Identify and analyze text in multiple languages within the forensic data
2. Look for suspects, evidence, timestamps, and activities regardless of language
3. Translate key findings when explaining them in the response language
4. Mention if content is found in multiple languages
5. Be culturally and linguistically appropriate
6. Extract names, phone numbers, addresses, and other evidence from multilingual text
7. Correlate information across different data types (e.g., match phone numbers in calls with contacts)
8. Identify patterns in communication, movement, and behavior
9. Highlight suspicious activities or unusual patterns

RESPONSE FORMAT:
- Use the EXACT same language as the user's query
- For Hinglish: Mix Hindi and English naturally (e.g., "Yeh case mein...", "Evidence show karta hai...")
- For other languages: Use proper grammar and vocabulary
- Always mention the source of information from forensic data
- Specify which data type the information comes from (calls, contacts, locations, chats, etc.)

{f"Language Detection Result: {detected_language}" if detected_language else ""}

Forensic Data Documents (May contain multilingual content from calls, contacts, locations, chats):
{context}

User Query: {query}

Your Response (MUST be in {detected_language or 'the specified language'}):"""
        
        # Debug information
        print(f"DEBUG - Query: {query}")
        print(f"DEBUG - Detected Language: {detected_language}")
        print(f"DEBUG - Language Instruction: {lang_instruction}")
        print(f"DEBUG - Explicit Language Parameter: {language}")
        
        # Query LLM via OpenRouter
        client = get_client()
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",  # GPT-4o-mini on OpenRouter
            messages=[
                {"role": "system", "content": f"You are a multilingual AI assistant specialized in forensic analysis. {lang_instruction} You must respond ONLY in the language specified in the prompt. Never respond in English unless explicitly asked to. Match the user's language exactly."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.1  # Keep low for more consistent language following
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Debug the response
        print(f"DEBUG - AI Response: {ai_response[:200]}...")
        
        return JSONResponse(content={
            "query": query, 
            "response": ai_response, 
            "context_used": len(context) > 0, 
            "session_id": session_id,
            "detected_language": detected_language,
            "language_instruction": lang_instruction,
            "debug_info": {
                "explicit_language": language,
                "auto_detected": detected_language,
                "instruction_sent": lang_instruction
            }
        })
    
    except Exception as e:
        print(f"Query error details: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
        # Check for OpenRouter credits error specifically (402)
        if "402" in str(e) or "Insufficient credits" in str(e):
            mock_response = f"API credits insufficient for full AI analysis. Mock response based on context."
            return JSONResponse(content={"query": query, "response": mock_response, "context_used": len(context) > 0 if 'context' in locals() else False, "session_id": session_id})
        
        raise HTTPException(status_code=500, detail=f"Error querying documents: {str(e)}")


# ===== FORENSIC DATA ENDPOINTS =====

@app.post("/forensic/parse-all/{session_id}")
async def parse_forensic_data(
    session_id: str,
    case_id: str = Form(...),
    db = Depends(get_database)
):
    """
    Parse all forensic data from uploaded UFDR files for a session
    """
    try:
        import forensic_parser
        import json
        import zipfile
        
        # Get session info
        session = await crud.get_session_by_id(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get files for this session
        files = await crud.get_files_by_session(db, session_id)
        if not files:
            raise HTTPException(status_code=404, detail="No files found for session")
        
        all_forensic_data = {
            'messenger_messages': [],
            'messenger_calls': [],
            'messenger_accounts': [],
            'call_logs': [],
            'find_my_locations': []
        }
        
        # Process each file
        for file_meta in files:
            # Try to find and parse the original UFDR file
            # In production, you'd store the file path or retrieve from cloud storage
            # For now, we'll extract from ChromaDB metadata or skip
            print(f"Processing file: {file_meta.get('filename')}")
        
        # Parse documents from vector store context
        try:
            from vector_store import get_full_context
            context = get_full_context(session_id, "", top_k=10)
            
            # Try to parse JSON from context
            for chunk in context:
                try:
                    # Attempt to parse as JSON
                    json_data = json.loads(chunk)
                    forensic_data = forensic_parser.parse_all_forensic_data(json_data)
                    
                    # Merge results
                    all_forensic_data['messenger_messages'].extend(forensic_data.get('messenger_messages', []))
                    all_forensic_data['messenger_calls'].extend(forensic_data.get('messenger_calls', []))
                    all_forensic_data['messenger_accounts'].extend(forensic_data.get('messenger_accounts', []))
                    all_forensic_data['call_logs'].extend(forensic_data.get('call_logs', []))
                    all_forensic_data['find_my_locations'].extend(forensic_data.get('find_my_locations', []))
                except json.JSONDecodeError:
                    continue
        except Exception as e:
            print(f"Error extracting forensic data: {str(e)}")
        
        # Add session_id and case_id to all records
        for msg in all_forensic_data['messenger_messages']:
            msg['session_id'] = session_id
            msg['case_id'] = case_id
        for call in all_forensic_data['messenger_calls']:
            call['session_id'] = session_id
            call['case_id'] = case_id
        for account in all_forensic_data['messenger_accounts']:
            account['session_id'] = session_id
            account['case_id'] = case_id
        for log in all_forensic_data['call_logs']:
            log['session_id'] = session_id
            log['case_id'] = case_id
        for loc in all_forensic_data['find_my_locations']:
            loc['session_id'] = session_id
            loc['case_id'] = case_id
        
        # Bulk insert into MongoDB
        msg_count = await crud.bulk_create_messenger_messages(db, all_forensic_data['messenger_messages'])
        call_count = await crud.bulk_create_messenger_calls(db, all_forensic_data['messenger_calls'])
        account_count = await crud.bulk_create_messenger_accounts(db, all_forensic_data['messenger_accounts'])
        log_count = await crud.bulk_create_call_logs(db, all_forensic_data['call_logs'])
        loc_count = await crud.bulk_create_find_my_locations(db, all_forensic_data['find_my_locations'])
        
        # Generate and save summary
        summary_data = forensic_parser.extract_forensic_summary(all_forensic_data)
        summary_data['session_id'] = session_id
        summary_data['case_id'] = case_id
        await crud.create_forensic_summary(db, summary_data)
        
        return JSONResponse(content={
            "message": "Forensic data parsed successfully",
            "counts": {
                "messenger_messages": msg_count,
                "messenger_calls": call_count,
                "messenger_accounts": account_count,
                "call_logs": log_count,
                "find_my_locations": loc_count
            },
            "summary": serialize_datetime(summary_data)
        })
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error parsing forensic data: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error parsing forensic data: {str(e)}")


@app.get("/forensic/messenger/{session_id}")
async def get_messenger_data(
    session_id: str,
    app_name: Optional[str] = None,
    db = Depends(get_database)
):
    """
    Get all messenger data (messages, calls, accounts) for a session
    """
    try:
        messages = await crud.get_messenger_messages_by_session(db, session_id)
        calls = await crud.get_messenger_calls_by_session(db, session_id)
        accounts = await crud.get_messenger_accounts_by_session(db, session_id)
        
        # Filter by app if specified
        if app_name:
            messages = [m for m in messages if m.get('app_name') == app_name]
            calls = [c for c in calls if c.get('app_name') == app_name]
            accounts = [a for a in accounts if a.get('app_name') == app_name]
        
        # Serialize datetime objects
        messages = [serialize_datetime(m) for m in messages]
        calls = [serialize_datetime(c) for c in calls]
        accounts = [serialize_datetime(a) for a in accounts]
        
        return JSONResponse(content={
            "messages": messages,
            "calls": calls,
            "accounts": accounts,
            "total_messages": len(messages),
            "total_calls": len(calls),
            "total_accounts": len(accounts)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching messenger data: {str(e)}")


@app.get("/forensic/call-logs/{session_id}")
async def get_call_logs_data(
    session_id: str,
    db = Depends(get_database)
):
    """
    Get all call logs for a session
    """
    try:
        call_logs = await crud.get_call_logs_by_session(db, session_id)
        call_logs = [serialize_datetime(log) for log in call_logs]
        
        return JSONResponse(content={
            "call_logs": call_logs,
            "total_calls": len(call_logs)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching call logs: {str(e)}")


@app.get("/forensic/find-my/{session_id}")
async def get_find_my_data(
    session_id: str,
    db = Depends(get_database)
):
    """
    Get all Find My location data for a session
    """
    try:
        locations = await crud.get_find_my_locations_by_session(db, session_id)
        locations = [serialize_datetime(loc) for loc in locations]
        
        return JSONResponse(content={
            "locations": locations,
            "total_locations": len(locations)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching Find My data: {str(e)}")


@app.get("/forensic/summary/{session_id}")
async def get_forensic_summary_endpoint(
    session_id: str,
    db = Depends(get_database)
):
    """
    Get forensic data summary for a session
    """
    try:
        summary = await crud.get_forensic_summary_by_session(db, session_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Forensic summary not found")
        
        summary = serialize_datetime(summary)
        return JSONResponse(content=summary)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching forensic summary: {str(e)}")


@app.get("/forensic/case/{case_id}")
async def get_case_forensic_data(
    case_id: str,
    data_type: Optional[str] = None,  # "messenger", "call_logs", "find_my", "all"
    db = Depends(get_database)
):
    """
    Get all forensic data for a case
    """
    try:
        result = {}
        
        if data_type is None or data_type == "all" or data_type == "messenger":
            messages = await crud.get_messenger_messages_by_case(db, case_id)
            calls = await crud.get_messenger_calls_by_case(db, case_id)
            accounts = await crud.get_messenger_accounts_by_case(db, case_id)
            result['messenger'] = {
                'messages': [serialize_datetime(m) for m in messages],
                'calls': [serialize_datetime(c) for c in calls],
                'accounts': [serialize_datetime(a) for a in accounts]
            }
        
        if data_type is None or data_type == "all" or data_type == "call_logs":
            call_logs = await crud.get_call_logs_by_case(db, case_id)
            result['call_logs'] = [serialize_datetime(log) for log in call_logs]
        
        if data_type is None or data_type == "all" or data_type == "find_my":
            locations = await crud.get_find_my_locations_by_case(db, case_id)
            result['find_my_locations'] = [serialize_datetime(loc) for loc in locations]
        
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching case forensic data: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)