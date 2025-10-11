"""
Forensic Data Parser - Cellebrite Physical Analyzer inspired
Extracts Messenger, Call Logs, and Find My location data from UFDR files
"""
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path


def parse_timestamp(timestamp_str: Any) -> Optional[datetime]:
    """
    Parse various timestamp formats to datetime object
    """
    if not timestamp_str:
        return None
    
    if isinstance(timestamp_str, datetime):
        return timestamp_str
    
    # Try common timestamp formats
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%d/%m/%Y %H:%M:%S",
        "%m/%d/%Y %H:%M:%S",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(str(timestamp_str), fmt)
        except (ValueError, TypeError):
            continue
    
    # Try Unix timestamp (seconds or milliseconds)
    try:
        timestamp_num = float(timestamp_str)
        # If timestamp is in milliseconds
        if timestamp_num > 10000000000:
            timestamp_num = timestamp_num / 1000
        return datetime.fromtimestamp(timestamp_num)
    except (ValueError, TypeError):
        pass
    
    return None


def extract_phone_number(text: str) -> Optional[str]:
    """
    Extract phone number from text using regex
    """
    if not text:
        return None
    
    # Pattern for various phone number formats
    patterns = [
        r'\+?1?\d{10,15}',  # International format
        r'\(\d{3}\)\s*\d{3}[-\s]?\d{4}',  # (xxx) xxx-xxxx
        r'\d{3}[-\s]?\d{3}[-\s]?\d{4}',  # xxx-xxx-xxxx
    ]
    
    for pattern in patterns:
        match = re.search(pattern, str(text))
        if match:
            return match.group(0)
    
    return str(text)


def parse_messenger_data(json_data: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Parse Messenger app data (messages, calls, accounts)
    Returns: (messages, calls, accounts)
    """
    messages = []
    calls = []
    accounts = []
    
    # NEW: Handle flat structure with 'messages' array at root level (SMS messages)
    if 'messages' in json_data and isinstance(json_data['messages'], list):
        for msg_data in json_data['messages']:
            # Default to SMS if no type specified
            msg_type = msg_data.get('type', 'SMS').lower()
            app_name = 'whatsapp' if msg_type == 'whatsapp' else 'signal' if msg_type == 'signal' else 'telegram' if msg_type == 'telegram' else 'sms'
            
            timestamp = parse_timestamp(msg_data.get('timestamp'))
            
            messages.append({
                'app_name': app_name,
                'message_type': 'sent',  # Assume sent for now
                'sender': msg_data.get('from', 'Unknown'),
                'receiver': msg_data.get('to', 'Unknown'),
                'content': msg_data.get('body', ''),
                'timestamp': timestamp.isoformat() if timestamp else None,
                'is_encrypted': False,  # SMS is not encrypted
                'encryption_type': None,
                'has_attachments': False,
                'attachment_count': 0,
                'attachment_types': [],
                'latitude': None,
                'longitude': None,
                'metadata': msg_data
            })
    
    # NEW: Handle 'apps' array for WhatsApp/other messaging apps
    if 'apps' in json_data and isinstance(json_data['apps'], list):
        for app_data in json_data['apps']:
            app_name = app_data.get('app', '').lower()
            
            # Handle WhatsApp groups
            if 'groups' in app_data:
                for group in app_data['groups']:
                    group_name = group.get('name', 'Unknown Group')
                    participants = group.get('participants', [])
                    
                    # Parse messages in the group
                    if 'messages' in group:
                        for msg_data in group['messages']:
                            timestamp = parse_timestamp(msg_data.get('date') or msg_data.get('timestamp'))
                            
                            messages.append({
                                'app_name': app_name,
                                'message_type': msg_data.get('type', 'text'),
                                'sender': msg_data.get('from', 'Unknown'),
                                'receiver': group_name,  # Group name as receiver
                                'content': msg_data.get('body', ''),
                                'timestamp': timestamp.isoformat() if timestamp else None,
                                'is_encrypted': True,  # WhatsApp is encrypted
                                'encryption_type': 'end-to-end',
                                'has_attachments': msg_data.get('type', 'text') != 'text',
                                'attachment_count': 1 if msg_data.get('type', 'text') != 'text' else 0,
                                'attachment_types': [msg_data.get('type')] if msg_data.get('type', 'text') != 'text' else [],
                                'latitude': None,
                                'longitude': None,
                                'metadata': {**msg_data, 'group_name': group_name, 'participants': participants}
                            })
    
    # Check if data contains messenger information in nested structure
    messenger_keys = [
        'messenger', 'facebook_messenger', 'fb_messenger',
        'whatsapp', 'telegram', 'signal', 'viber', 'skype',
        'chats', 'conversations'
    ]
    
    for key in messenger_keys:
        if key in json_data:
            messenger_section = json_data[key]
            
            # Parse accounts
            if 'accounts' in messenger_section:
                for account_data in messenger_section['accounts']:
                    accounts.append({
                        'app_name': key,
                        'username': account_data.get('username'),
                        'display_name': account_data.get('display_name') or account_data.get('name'),
                        'phone_number': account_data.get('phone') or account_data.get('phone_number'),
                        'email': account_data.get('email'),
                        'profile_picture_url': account_data.get('profile_picture') or account_data.get('avatar'),
                        'account_created': parse_timestamp(account_data.get('created_at') or account_data.get('joined_date')),
                        'last_active': parse_timestamp(account_data.get('last_active') or account_data.get('last_seen')),
                        'is_encrypted': account_data.get('encrypted', False),
                        'encryption_status': account_data.get('encryption_status', 'unknown'),
                        'contacts': account_data.get('contacts', []),
                        'metadata': account_data
                    })
            
            # Parse messages
            if 'messages' in messenger_section:
                for msg_data in messenger_section['messages']:
                    messages.append({
                        'app_name': key,
                        'account_id': msg_data.get('account_id'),
                        'account_name': msg_data.get('account_name'),
                        'message_type': msg_data.get('type', 'sent'),
                        'sender': msg_data.get('sender') or msg_data.get('from'),
                        'receiver': msg_data.get('receiver') or msg_data.get('to'),
                        'content': msg_data.get('content') or msg_data.get('text') or msg_data.get('message'),
                        'timestamp': parse_timestamp(msg_data.get('timestamp') or msg_data.get('time') or msg_data.get('date')),
                        'is_encrypted': msg_data.get('encrypted', False),
                        'encryption_type': msg_data.get('encryption_type'),
                        'has_attachments': bool(msg_data.get('attachments')),
                        'attachment_count': len(msg_data.get('attachments', [])),
                        'attachment_types': [att.get('type') for att in msg_data.get('attachments', [])],
                        'latitude': msg_data.get('latitude') or msg_data.get('lat'),
                        'longitude': msg_data.get('longitude') or msg_data.get('lon') or msg_data.get('long'),
                        'metadata': msg_data
                    })
            
            # Parse calls
            if 'calls' in messenger_section or 'call_history' in messenger_section:
                call_list = messenger_section.get('calls') or messenger_section.get('call_history')
                for call_data in call_list:
                    duration = call_data.get('duration') or call_data.get('duration_seconds')
                    start_time = parse_timestamp(call_data.get('start_time') or call_data.get('timestamp') or call_data.get('time'))
                    
                    # Calculate end_time if duration is provided
                    end_time = None
                    if start_time and duration:
                        from datetime import timedelta
                        end_time = start_time + timedelta(seconds=int(duration))
                    
                    calls.append({
                        'app_name': key,
                        'call_type': call_data.get('type', 'outgoing'),
                        'caller': call_data.get('caller') or call_data.get('from'),
                        'receiver': call_data.get('receiver') or call_data.get('to'),
                        'start_time': start_time,
                        'end_time': end_time,
                        'duration_seconds': int(duration) if duration else None,
                        'is_video': call_data.get('is_video', False) or call_data.get('video', False),
                        'call_quality': call_data.get('quality'),
                        'metadata': call_data
                    })
    
    return messages, calls, accounts


def parse_call_logs(json_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Parse native device call logs
    Returns: list of call log dictionaries
    """
    call_logs = []
    
    # NEW: Handle flat structure with 'calls' array at root level
    if 'calls' in json_data and isinstance(json_data['calls'], list):
        # Get contacts for name lookup
        contacts_map = {}
        if 'contacts' in json_data:
            for contact in json_data['contacts']:
                phone = contact.get('number', '')
                name = contact.get('name', '')
                if phone and name:
                    contacts_map[phone] = name
        
        for call_data in json_data['calls']:
            # Determine call type and phone number
            from_num = call_data.get('from', '') or ''
            to_num = call_data.get('to', '') or ''
            call_type = call_data.get('type', '').lower()
            
            # Get the other party's number
            # For outgoing calls, use 'to' if available, else use 'from'
            # For incoming calls, use 'from'
            # For missed calls, use 'from'
            if call_type == 'outgoing':
                phone = to_num if to_num else from_num
            else:  # incoming or missed
                phone = from_num
            
            contact_name = contacts_map.get(phone, None)
            
            timestamp = parse_timestamp(call_data.get('datetime'))
            
            # Parse duration (handle string or int)
            duration = call_data.get('duration', 0)
            if isinstance(duration, str):
                try:
                    duration = int(duration)
                except ValueError:
                    duration = 0
            
            call_logs.append({
                'call_type': call_type,
                'phone_number': phone,
                'contact_name': contact_name,
                'timestamp': timestamp.isoformat() if timestamp else None,
                'duration_seconds': duration,
                'sim_card': call_data.get('sim_card'),
                'network_type': call_data.get('network_type'),
                'cell_tower_id': call_data.get('cell_tower_id'),
                'latitude': call_data.get('latitude'),
                'longitude': call_data.get('longitude'),
                'metadata': call_data
            })
        
        # Return early if we found call logs in flat structure
        if call_logs:
            return call_logs
    
    # Original nested structure parsing
    call_log_keys = [
        'call_log', 'call_logs', 'phone_calls',
        'call_history', 'dialed_calls', 'received_calls'
    ]
    
    for key in call_log_keys:
        if key in json_data:
            call_log_section = json_data[key]
            
            # Handle both dict and list formats
            call_list = call_log_section if isinstance(call_log_section, list) else call_log_section.get('entries', [])
            
            for call_data in call_list:
                phone = extract_phone_number(call_data.get('phone_number') or call_data.get('number') or call_data.get('phone'))
                
                timestamp = parse_timestamp(call_data.get('timestamp') or call_data.get('time') or call_data.get('date'))
                
                call_logs.append({
                    'call_type': call_data.get('type', 'outgoing').lower(),
                    'phone_number': phone,
                    'contact_name': call_data.get('contact_name') or call_data.get('name'),
                    'timestamp': timestamp.isoformat() if timestamp else None,
                    'duration_seconds': int(call_data.get('duration') or 0) if call_data.get('duration') else None,
                    'sim_card': call_data.get('sim_card') or call_data.get('sim'),
                    'network_type': call_data.get('network_type') or call_data.get('network'),
                    'cell_tower_id': call_data.get('cell_tower_id') or call_data.get('tower_id'),
                    'latitude': call_data.get('latitude') or call_data.get('lat'),
                    'longitude': call_data.get('longitude') or call_data.get('lon') or call_data.get('long'),
                    'metadata': call_data
                })
    
    return call_logs


def parse_find_my_data(json_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Parse iOS Find My location data
    Returns: list of location dictionaries
    """
    locations = []
    
    # NEW: Handle flat structure with 'locations' array at root level
    if 'locations' in json_data and isinstance(json_data['locations'], list):
        # Get device info for context
        device_info = json_data.get('device_info', {})
        device_model = device_info.get('model', 'Unknown Device')
        device_name = device_info.get('owner_name', device_model)
        
        for loc_data in json_data['locations']:
            # Extract coordinates (already strings in user's format)
            lat = loc_data.get('latitude')
            lon = loc_data.get('longitude')
            
            # Skip if no coordinates
            if not (lat and lon):
                continue
            
            timestamp = parse_timestamp(loc_data.get('timestamp'))
            
            locations.append({
                'device_name': device_name,
                'device_model': device_model,
                'device_id': device_info.get('imei', 'unknown'),
                'latitude': float(lat),
                'longitude': float(lon),
                'altitude': float(loc_data.get('altitude')) if loc_data.get('altitude') else None,
                'accuracy': float(loc_data.get('accuracy')) if loc_data.get('accuracy') else None,
                'timestamp': timestamp.isoformat() if timestamp else None,
                'battery_level': int(loc_data.get('battery_level')) if loc_data.get('battery_level') else None,
                'is_charging': loc_data.get('is_charging'),
                'location_source': loc_data.get('location_source', 'GPS'),
                'speed': float(loc_data.get('speed')) if loc_data.get('speed') else None,
                'heading': float(loc_data.get('heading')) if loc_data.get('heading') else None,
                'address': loc_data.get('note') or loc_data.get('address'),  # User's format uses 'note'
                'metadata': loc_data
            })
        
        # Return early if we found locations in flat structure
        if locations:
            return locations
    
    # Original nested structure parsing
    location_keys = [
        'find_my', 'findmy', 'find_my_iphone', 'find_my_device',
        'icloud_locations', 'device_locations', 'location_history',
        'gps_data', 'location_data'
    ]
    
    for key in location_keys:
        if key in json_data:
            location_section = json_data[key]
            
            # Handle both dict and list formats
            location_list = location_section if isinstance(location_section, list) else location_section.get('locations', [])
            
            for loc_data in location_list:
                # Extract coordinates
                lat = loc_data.get('latitude') or loc_data.get('lat')
                lon = loc_data.get('longitude') or loc_data.get('lon') or loc_data.get('long')
                
                # Skip if no coordinates
                if not (lat and lon):
                    continue
                
                timestamp = parse_timestamp(loc_data.get('timestamp') or loc_data.get('time') or loc_data.get('date'))
                
                locations.append({
                    'device_name': loc_data.get('device_name') or loc_data.get('device') or 'Unknown Device',
                    'device_model': loc_data.get('device_model') or loc_data.get('model'),
                    'device_id': loc_data.get('device_id') or loc_data.get('id') or str(loc_data.get('udid', 'unknown')),
                    'latitude': float(lat),
                    'longitude': float(lon),
                    'altitude': float(loc_data.get('altitude')) if loc_data.get('altitude') else None,
                    'accuracy': float(loc_data.get('accuracy')) if loc_data.get('accuracy') else None,
                    'timestamp': timestamp.isoformat() if timestamp else None,
                    'battery_level': int(loc_data.get('battery_level') or loc_data.get('battery')) if loc_data.get('battery_level') or loc_data.get('battery') else None,
                    'is_charging': loc_data.get('is_charging') or loc_data.get('charging'),
                    'location_source': loc_data.get('location_source') or loc_data.get('source') or 'GPS',
                    'speed': float(loc_data.get('speed')) if loc_data.get('speed') else None,
                    'heading': float(loc_data.get('heading') or loc_data.get('direction')) if loc_data.get('heading') or loc_data.get('direction') else None,
                    'address': loc_data.get('address') or loc_data.get('location_name'),
                    'metadata': loc_data
                })
    
    return locations


def parse_all_forensic_data(json_data) -> Dict[str, Any]:
    """
    Parse all forensic data from UFDR JSON or text
    Returns: dictionary containing all parsed forensic data
    Accepts: Dict[str, Any] or str (JSON text)
    """
    # Handle string input - try to parse as JSON
    if isinstance(json_data, str):
        try:
            json_data = json.loads(json_data)
        except json.JSONDecodeError:
            print("[DEBUG] Failed to parse text as JSON, returning empty data")
            return {
                'messenger_messages': [],
                'messenger_calls': [],
                'messenger_accounts': [],
                'call_logs': [],
                'find_my_locations': [],
                'total_messages': 0,
                'total_calls': 0,
                'total_accounts': 0,
                'total_locations': 0
            }
    
    print(f"[DEBUG] parse_all_forensic_data received keys: {list(json_data.keys())}")
    print(f"[DEBUG] Has 'messages': {('messages' in json_data)}")
    print(f"[DEBUG] Has 'calls': {('calls' in json_data)}")
    print(f"[DEBUG] Has 'locations': {('locations' in json_data)}")
    
    messages, calls, accounts = parse_messenger_data(json_data)
    print(f"[DEBUG] parse_messenger_data returned: {len(messages)} messages, {len(calls)} calls, {len(accounts)} accounts")
    
    call_logs = parse_call_logs(json_data)
    print(f"[DEBUG] parse_call_logs returned: {len(call_logs)} call logs")
    
    locations = parse_find_my_data(json_data)
    print(f"[DEBUG] parse_find_my_data returned: {len(locations)} locations")
    
    return {
        'messenger_messages': messages,
        'messenger_calls': calls,
        'messenger_accounts': accounts,
        'call_logs': call_logs,
        'find_my_locations': locations,
        'total_messages': len(messages),
        'total_calls': len(calls) + len(call_logs),
        'total_accounts': len(accounts),
        'total_locations': len(locations)
    }


def extract_forensic_summary(forensic_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate summary statistics from forensic data
    """
    all_timestamps = []
    contact_frequency = {}
    app_usage = {}
    
    # Collect timestamps from messages
    for msg in forensic_data.get('messenger_messages', []):
        if msg.get('timestamp'):
            all_timestamps.append(msg['timestamp'])
        
        # Count contacts
        for person in [msg.get('sender'), msg.get('receiver')]:
            if person:
                contact_frequency[person] = contact_frequency.get(person, 0) + 1
        
        # Count app usage
        app = msg.get('app_name')
        if app:
            app_usage[app] = app_usage.get(app, 0) + 1
    
    # Collect timestamps from calls
    for call in forensic_data.get('messenger_calls', []) + forensic_data.get('call_logs', []):
        if call.get('start_time') or call.get('timestamp'):
            all_timestamps.append(call.get('start_time') or call['timestamp'])
        
        # Count contacts
        for person in [call.get('caller'), call.get('receiver'), call.get('phone_number')]:
            if person:
                contact_frequency[person] = contact_frequency.get(person, 0) + 1
    
    # Collect timestamps from locations
    for loc in forensic_data.get('find_my_locations', []):
        if loc.get('timestamp'):
            all_timestamps.append(loc['timestamp'])
    
    # Sort timestamps
    all_timestamps = [ts for ts in all_timestamps if ts]
    all_timestamps.sort()
    
    # Get top contacts
    top_contacts = sorted(contact_frequency.items(), key=lambda x: x[1], reverse=True)[:10]
    top_contacts_list = [{'contact': contact, 'count': count} for contact, count in top_contacts]
    
    # Get most active apps
    most_active_apps_list = sorted(app_usage.items(), key=lambda x: x[1], reverse=True)
    most_active_apps_list = [{'app': app, 'count': count} for app, count in most_active_apps_list]
    
    # Cluster locations (simple proximity grouping)
    location_clusters = []
    locations = forensic_data.get('find_my_locations', [])
    if locations:
        # Simple clustering by proximity (within ~100m)
        clustered = []
        for loc in locations:
            lat, lon = loc.get('latitude'), loc.get('longitude')
            if not (lat and lon):
                continue
            
            # Find existing cluster
            found_cluster = False
            for cluster in location_clusters:
                cluster_lat, cluster_lon = cluster['latitude'], cluster['longitude']
                # Simple distance check (approximate)
                if abs(lat - cluster_lat) < 0.001 and abs(lon - cluster_lon) < 0.001:
                    cluster['count'] += 1
                    found_cluster = True
                    break
            
            if not found_cluster:
                location_clusters.append({
                    'latitude': lat,
                    'longitude': lon,
                    'count': 1,
                    'address': loc.get('address')
                })
    
    return {
        'messenger_accounts': forensic_data.get('total_accounts', 0),
        'messenger_messages': forensic_data.get('total_messages', 0),
        'messenger_calls': len(forensic_data.get('messenger_calls', [])),
        'call_logs': len(forensic_data.get('call_logs', [])),
        'find_my_locations': forensic_data.get('total_locations', 0),
        'earliest_activity': all_timestamps[0] if all_timestamps else None,
        'latest_activity': all_timestamps[-1] if all_timestamps else None,
        'top_contacts': top_contacts_list,
        'most_active_apps': most_active_apps_list,
        'location_clusters': location_clusters[:10]  # Top 10 clusters
    }
