import os
import json
import zipfile
import tempfile
import shutil
from typing import Dict, List, Any, Union

def parse_ufdr(file_path: str) -> str:
    """
    Parse UFDR file and extract text content.
    Assumes binary file; decodes with UTF-8 ignoring errors for readable text.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"UFDR file not found: {file_path}")
    
    with open(file_path, 'rb') as f:
        content = f.read()
    
    # Decode binary to text, ignoring non-UTF-8 parts
    text = content.decode('utf-8', errors='ignore')
    
    # Clean up whitespace
    text = ' '.join(text.split())
    
    return text

def extract_ufdr_contents(file_path: str) -> str:
    """
    Extract all JSON files from UFDR container and return combined text.
    UFDR files are typically ZIP archives containing JSON files.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"UFDR file not found: {file_path}")
    
    extracted_texts = []
    temp_dir = None
    
    try:
        # Create temporary directory for extraction
        temp_dir = tempfile.mkdtemp()
        
        # Try to open as ZIP file (UFDR files are typically ZIP archives)
        try:
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
        except zipfile.BadZipFile:
            # If not a ZIP file, treat as binary and extract text
            return parse_ufdr(file_path)
        
        # Process all extracted JSON files
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                if file.endswith('.json'):
                    json_path = os.path.join(root, file)
                    try:
                        # Parse and format the JSON file
                        json_text = parse_json_data(json_path)
                        if json_text:
                            extracted_texts.append(json_text)
                    except Exception as e:
                        print(f"Error processing {json_path}: {e}")
                        continue
        
        # If no JSON files found, fall back to binary parsing
        if not extracted_texts:
            return parse_ufdr(file_path)
        
        return "\n\n".join(extracted_texts)
        
    except Exception as e:
        print(f"Error extracting UFDR contents: {e}")
        # Fall back to binary parsing
        return parse_ufdr(file_path)
    
    finally:
        # Clean up temporary directory
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

def list_ufdr_contents(file_path: str) -> List[Dict[str, Any]]:
    """
    List all JSON files contained in the UFDR file.
    Returns a list of file information dictionaries.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"UFDR file not found: {file_path}")
    
    files_info = []
    temp_dir = None
    
    try:
        # Create temporary directory for extraction
        temp_dir = tempfile.mkdtemp()
        
        # Try to open as ZIP file
        try:
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
        except zipfile.BadZipFile:
            # If not a ZIP file, return basic info
            return [{
                "name": os.path.basename(file_path),
                "type": "binary",
                "size": os.path.getsize(file_path),
                "path": file_path
            }]
        
        # List all JSON files
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                if file.endswith('.json'):
                    file_path_full = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path_full, temp_dir)
                    
                    # Determine file type based on name
                    file_type = "unknown"
                    if "call" in file.lower():
                        file_type = "calls"
                    elif "contact" in file.lower():
                        file_type = "contacts"
                    elif "location" in file.lower():
                        file_type = "locations"
                    elif "manifest" in file.lower():
                        file_type = "manifest"
                    elif "wa_chat" in file.lower() or "whatsapp" in file.lower():
                        file_type = "whatsapp_chat"
                    elif "tg_chat" in file.lower() or "telegram" in file.lower():
                        file_type = "telegram_chat"
                    
                    files_info.append({
                        "name": file,
                        "type": file_type,
                        "size": os.path.getsize(file_path_full),
                        "path": relative_path,
                        "directory": os.path.dirname(relative_path)
                    })
        
        return files_info
        
    except Exception as e:
        print(f"Error listing UFDR contents: {e}")
        return []
    
    finally:
        # Clean up temporary directory
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

def parse_json_data(file_path: str, file_type: str = None) -> str:
    """
    Parse JSON data files and convert to searchable text format.
    Supports calls.json, contacts.json, locations.json, manifest.json, 
    WhatsApp chats, and Telegram chats.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"JSON file not found: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Determine file type from filename if not provided
    if file_type is None:
        filename = os.path.basename(file_path).lower()
        if 'call' in filename:
            file_type = 'calls'
        elif 'contact' in filename:
            file_type = 'contacts'
        elif 'location' in filename:
            file_type = 'locations'
        elif 'manifest' in filename:
            file_type = 'manifest'
        elif 'wa_chat' in filename or 'whatsapp' in filename:
            file_type = 'whatsapp_chat'
        elif 'tg_chat' in filename or 'telegram' in filename:
            file_type = 'telegram_chat'
    
    return format_json_data(data, file_type)

def format_json_data(data: Union[Dict, List], file_type: str) -> str:
    """
    Format JSON data into readable text based on file type.
    """
    if file_type == 'calls':
        return format_calls_data(data)
    elif file_type == 'contacts':
        return format_contacts_data(data)
    elif file_type == 'locations':
        return format_locations_data(data)
    elif file_type == 'manifest':
        return format_manifest_data(data)
    elif file_type == 'whatsapp_chat':
        return format_whatsapp_chat_data(data)
    elif file_type == 'telegram_chat':
        return format_telegram_chat_data(data)
    else:
        # Generic JSON formatting
        return json.dumps(data, indent=2, ensure_ascii=False)

def format_calls_data(calls: List[Dict]) -> str:
    """Format call records into readable text."""
    text_parts = ["CALL RECORDS:"]
    
    for call in calls:
        call_text = f"Call ID: {call.get('id', 'Unknown')}\n"
        call_text += f"Date/Time: {call.get('datetime', 'Unknown')}\n"
        call_text += f"From: {call.get('from', 'Unknown')}\n"
        call_text += f"To: {call.get('to', 'Unknown')}\n"
        call_text += f"Duration: {call.get('duration_seconds', 0)} seconds\n"
        call_text += f"Type: {call.get('type', 'Unknown')}\n"
        call_text += f"Device: {call.get('device', 'Unknown')}\n"
        text_parts.append(call_text)
    
    return "\n\n".join(text_parts)

def format_contacts_data(contacts: List[Dict]) -> str:
    """Format contact records into readable text."""
    text_parts = ["CONTACT RECORDS:"]
    
    for contact in contacts:
        contact_text = f"Contact ID: {contact.get('id', 'Unknown')}\n"
        contact_text += f"Name: {contact.get('name', 'Unknown')}\n"
        contact_text += f"Phone: {contact.get('phone', 'Unknown')}\n"
        text_parts.append(contact_text)
    
    return "\n\n".join(text_parts)

def format_locations_data(locations: List[Dict]) -> str:
    """Format location records into readable text."""
    text_parts = ["LOCATION RECORDS:"]
    
    for location in locations:
        location_text = f"Location ID: {location.get('id', 'Unknown')}\n"
        location_text += f"Latitude: {location.get('lat', 'Unknown')}\n"
        location_text += f"Longitude: {location.get('lon', 'Unknown')}\n"
        location_text += f"Timestamp: {location.get('timestamp', 'Unknown')}\n"
        text_parts.append(location_text)
    
    return "\n\n".join(text_parts)

def format_manifest_data(manifest: Dict) -> str:
    """Format manifest data into readable text."""
    text_parts = ["MANIFEST INFORMATION:"]
    
    for key, value in manifest.items():
        text_parts.append(f"{key.replace('_', ' ').title()}: {value}")
    
    return "\n".join(text_parts)

def format_whatsapp_chat_data(chat_data: Dict) -> str:
    """Format WhatsApp chat data into readable text."""
    text_parts = [f"WHATSAPP CHAT: {chat_data.get('chat_name', 'Unknown')}"]
    
    # Add members
    members = chat_data.get('members', [])
    if members:
        text_parts.append("MEMBERS:")
        for member in members:
            member_text = f"- {member.get('name', 'Unknown')} ({member.get('phone', 'Unknown')})"
            text_parts.append(member_text)
    
    # Add messages
    messages = chat_data.get('messages', [])
    if messages:
        text_parts.append("\nMESSAGES:")
        for message in messages:
            msg_text = f"From: {message.get('from', 'Unknown')}\n"
            msg_text += f"To: {', '.join(message.get('to', []))}\n"
            msg_text += f"Date/Time: {message.get('datetime', 'Unknown')}\n"
            msg_text += f"Text: {message.get('text', 'No text')}\n"
            if message.get('attachments'):
                msg_text += f"Attachments: {len(message.get('attachments', []))} files\n"
            text_parts.append(msg_text)
    
    return "\n\n".join(text_parts)

def format_telegram_chat_data(chat_data: Dict) -> str:
    """Format Telegram chat data into readable text."""
    text_parts = [f"TELEGRAM CHAT: {chat_data.get('chat_name', 'Unknown')}"]
    
    # Add members
    members = chat_data.get('members', [])
    if members:
        text_parts.append("MEMBERS:")
        for member in members:
            member_text = f"- {member.get('name', 'Unknown')} ({member.get('phone', 'Unknown')})"
            text_parts.append(member_text)
    
    # Add messages
    messages = chat_data.get('messages', [])
    if messages:
        text_parts.append("\nMESSAGES:")
        for message in messages:
            msg_text = f"From: {message.get('from', 'Unknown')}\n"
            msg_text += f"To: {', '.join(message.get('to', []))}\n"
            msg_text += f"Date/Time: {message.get('datetime', 'Unknown')}\n"
            msg_text += f"Text: {message.get('text', 'No text')}\n"
            if message.get('attachments'):
                msg_text += f"Attachments: {len(message.get('attachments', []))} files\n"
            text_parts.append(msg_text)
    
    return "\n\n".join(text_parts)

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    """
    Split text into overlapping chunks for better context in embeddings.
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    
    return chunks