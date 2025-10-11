"""
Multi-Format UFDR Parser
Supports JSON, XML, CSV, TXT, and HTML formats
Extracts calls, messages, locations, and other forensic data
"""
import json
import xml.etree.ElementTree as ET
import pandas as pd
import csv
import re
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path


class MultiFormatParser:
    """
    Unified parser for multiple forensic data formats
    Handles JSON, XML, CSV, TXT, and HTML files
    """
    
    def __init__(self):
        self.data = {
            "calls": [],
            "messages": [],
            "locations": [],
            "contacts": [],
            "browser_history": [],
            "apps": [],
            "device_info": {},
            "metadata": {}
        }
    
    def parse_directory(self, directory_path: str) -> Dict[str, Any]:
        """
        Parse all supported files in a directory
        """
        directory = Path(directory_path)
        
        for file_path in directory.rglob('*'):
            if file_path.is_file():
                self.parse_file(str(file_path))
        
        # Deduplicate data
        self._deduplicate()
        
        return self.data
    
    def parse_file(self, file_path: str) -> None:
        """
        Route file to appropriate parser based on extension
        """
        file_path = Path(file_path)
        extension = file_path.suffix.lower()
        
        try:
            if extension == '.json':
                self._parse_json(file_path)
            elif extension == '.xml':
                self._parse_xml(file_path)
            elif extension == '.csv':
                self._parse_csv(file_path)
            elif extension == '.txt':
                self._parse_txt(file_path)
            elif extension in ['.html', '.htm']:
                self._parse_html(file_path)
            else:
                print(f"Unsupported file format: {extension} for {file_path}")
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
    
    def _parse_json(self, file_path: Path) -> None:
        """
        Parse JSON files - supports multiple schemas
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extract calls
        if 'calls' in data:
            self.data['calls'].extend(self._normalize_calls(data['calls']))
        
        # Extract messages
        if 'messages' in data:
            self.data['messages'].extend(self._normalize_messages(data['messages']))
        
        # Extract locations
        if 'locations' in data:
            self.data['locations'].extend(self._normalize_locations(data['locations']))
        
        # Extract contacts
        if 'contacts' in data:
            self.data['contacts'].extend(self._normalize_contacts(data['contacts']))
        
        # Extract browser history
        if 'browser_history' in data:
            self.data['browser_history'].extend(data['browser_history'])
        
        # Extract apps/groups (WhatsApp, Telegram, etc.)
        if 'apps' in data:
            self.data['apps'].extend(data['apps'])
            # Also extract messages from app groups
            for app in data['apps']:
                if 'groups' in app:
                    for group in app['groups']:
                        if 'messages' in group:
                            # Add app context to messages
                            for msg in group['messages']:
                                msg['app'] = app.get('app', 'unknown')
                                msg['group_name'] = group.get('name', 'Unknown Group')
                            self.data['messages'].extend(
                                self._normalize_messages(group['messages'])
                            )
        
        # Extract device info
        if 'device_info' in data:
            self.data['device_info'].update(data['device_info'])
        
        # Extract metadata
        if 'extraction_info' in data:
            self.data['metadata'].update(data['extraction_info'])
    
    def _parse_xml(self, file_path: Path) -> None:
        """
        Parse XML files - common in forensic tools
        """
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Parse calls
        for call_elem in root.findall('.//call'):
            call = {
                'from': call_elem.findtext('from') or call_elem.get('from'),
                'to': call_elem.findtext('to') or call_elem.get('to'),
                'datetime': call_elem.findtext('datetime') or call_elem.get('timestamp'),
                'duration': call_elem.findtext('duration'),
                'type': call_elem.findtext('type') or call_elem.get('type'),
                'id': call_elem.findtext('id') or call_elem.get('id')
            }
            self.data['calls'].append(self._normalize_call(call))
        
        # Parse messages
        for msg_elem in root.findall('.//message'):
            message = {
                'from': msg_elem.findtext('from') or msg_elem.get('from'),
                'to': msg_elem.findtext('to') or msg_elem.get('to'),
                'body': msg_elem.findtext('body') or msg_elem.findtext('text'),
                'timestamp': msg_elem.findtext('timestamp') or msg_elem.get('timestamp'),
                'type': msg_elem.findtext('type') or msg_elem.get('type'),
                'id': msg_elem.findtext('id') or msg_elem.get('id')
            }
            self.data['messages'].append(self._normalize_message(message))
        
        # Parse locations
        for loc_elem in root.findall('.//location'):
            location = {
                'latitude': loc_elem.findtext('latitude') or loc_elem.get('lat'),
                'longitude': loc_elem.findtext('longitude') or loc_elem.get('lon'),
                'timestamp': loc_elem.findtext('timestamp') or loc_elem.get('timestamp'),
                'note': loc_elem.findtext('note') or loc_elem.findtext('address')
            }
            self.data['locations'].append(self._normalize_location(location))
        
        # Parse contacts
        for contact_elem in root.findall('.//contact'):
            contact = {
                'id': contact_elem.findtext('id') or contact_elem.get('id'),
                'name': contact_elem.findtext('name'),
                'number': contact_elem.findtext('number') or contact_elem.findtext('phone'),
                'email': contact_elem.findtext('email')
            }
            self.data['contacts'].append(self._normalize_contact(contact))
    
    def _parse_csv(self, file_path: Path) -> None:
        """
        Parse CSV files - determine type by headers or filename
        """
        filename_lower = file_path.stem.lower()
        
        try:
            df = pd.read_csv(file_path)
            
            # Detect CSV type by headers or filename
            headers = [col.lower() for col in df.columns]
            
            if 'url' in headers or 'browser' in filename_lower or 'history' in filename_lower:
                # Browser history
                self.data['browser_history'].extend(df.to_dict(orient='records'))
            
            elif ('from' in headers and 'to' in headers and 'duration' in headers) or 'call' in filename_lower:
                # Call logs
                for _, row in df.iterrows():
                    call = {
                        'from': row.get('from') or row.get('From'),
                        'to': row.get('to') or row.get('To'),
                        'datetime': row.get('datetime') or row.get('Date') or row.get('timestamp'),
                        'duration': row.get('duration') or row.get('Duration'),
                        'type': row.get('type') or row.get('Type')
                    }
                    self.data['calls'].append(self._normalize_call(call))
            
            elif ('from' in headers and 'body' in headers) or 'message' in filename_lower or 'sms' in filename_lower:
                # Messages
                for _, row in df.iterrows():
                    message = {
                        'from': row.get('from') or row.get('From'),
                        'to': row.get('to') or row.get('To'),
                        'body': row.get('body') or row.get('Body') or row.get('text') or row.get('Text'),
                        'timestamp': row.get('timestamp') or row.get('Timestamp') or row.get('date'),
                        'type': row.get('type') or row.get('Type')
                    }
                    self.data['messages'].append(self._normalize_message(message))
            
            elif ('latitude' in headers or 'lat' in headers) or 'location' in filename_lower or 'gps' in filename_lower:
                # Locations
                for _, row in df.iterrows():
                    location = {
                        'latitude': row.get('latitude') or row.get('lat') or row.get('Latitude'),
                        'longitude': row.get('longitude') or row.get('lon') or row.get('long') or row.get('Longitude'),
                        'timestamp': row.get('timestamp') or row.get('Timestamp') or row.get('date'),
                        'note': row.get('note') or row.get('address') or row.get('Note')
                    }
                    self.data['locations'].append(self._normalize_location(location))
            
            elif ('name' in headers and 'phone' in headers) or 'contact' in filename_lower:
                # Contacts
                for _, row in df.iterrows():
                    contact = {
                        'name': row.get('name') or row.get('Name'),
                        'number': row.get('phone') or row.get('Phone') or row.get('number') or row.get('Number'),
                        'email': row.get('email') or row.get('Email')
                    }
                    self.data['contacts'].append(self._normalize_contact(contact))
            
        except Exception as e:
            print(f"Error parsing CSV {file_path}: {e}")
    
    def _parse_txt(self, file_path: Path) -> None:
        """
        Parse text files - extract structured data if possible
        """
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Store as metadata/notes
        self.data['metadata'][f'notes_{file_path.stem}'] = content
        
        # Try to extract phone numbers and timestamps
        phone_pattern = r'\+?\d{10,15}'
        timestamp_pattern = r'\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}'
        
        phones = re.findall(phone_pattern, content)
        timestamps = re.findall(timestamp_pattern, content)
        
        if phones:
            self.data['metadata'][f'extracted_phones_{file_path.stem}'] = list(set(phones))
        if timestamps:
            self.data['metadata'][f'extracted_timestamps_{file_path.stem}'] = timestamps
    
    def _parse_html(self, file_path: Path) -> None:
        """
        Parse HTML summary reports
        """
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Store as metadata
        self.data['metadata'][f'report_{file_path.stem}'] = {
            'file': file_path.name,
            'content_length': len(content)
        }
        
        # Extract text from HTML (basic - remove tags)
        text_content = re.sub(r'<[^>]+>', ' ', content)
        text_content = ' '.join(text_content.split())
        
        # Try to find structured data in HTML
        phone_pattern = r'\+?\d{10,15}'
        phones = re.findall(phone_pattern, text_content)
        if phones:
            self.data['metadata'][f'html_phones_{file_path.stem}'] = list(set(phones))
    
    # Normalization methods
    def _normalize_calls(self, calls: List[Dict]) -> List[Dict]:
        """Normalize call data to standard format"""
        return [self._normalize_call(call) for call in calls]
    
    def _normalize_call(self, call: Dict) -> Dict:
        """Normalize single call record"""
        return {
            'id': call.get('id', f"call_{hash(str(call))}"),
            'from': call.get('from', ''),
            'to': call.get('to', ''),
            'datetime': call.get('datetime', ''),
            'duration': str(call.get('duration', '0')),
            'type': call.get('type', 'unknown').lower(),
            '_source': 'parsed'
        }
    
    def _normalize_messages(self, messages: List[Dict]) -> List[Dict]:
        """Normalize message data to standard format"""
        return [self._normalize_message(msg) for msg in messages]
    
    def _normalize_message(self, message: Dict) -> Dict:
        """Normalize single message record"""
        return {
            'id': message.get('id', f"msg_{hash(str(message))}"),
            'from': message.get('from', ''),
            'to': message.get('to', ''),
            'body': message.get('body', message.get('text', '')),
            'timestamp': message.get('timestamp', message.get('date', '')),
            'type': message.get('type', 'SMS'),
            'app': message.get('app', 'unknown'),
            'group_name': message.get('group_name'),
            '_source': 'parsed'
        }
    
    def _normalize_locations(self, locations: List[Dict]) -> List[Dict]:
        """Normalize location data to standard format"""
        return [self._normalize_location(loc) for loc in locations]
    
    def _normalize_location(self, location: Dict) -> Dict:
        """Normalize single location record"""
        return {
            'latitude': str(location.get('latitude', location.get('lat', ''))),
            'longitude': str(location.get('longitude', location.get('lon', location.get('long', '')))),
            'timestamp': location.get('timestamp', ''),
            'note': location.get('note', location.get('address', '')),
            '_source': 'parsed'
        }
    
    def _normalize_contacts(self, contacts: List[Dict]) -> List[Dict]:
        """Normalize contact data to standard format"""
        return [self._normalize_contact(contact) for contact in contacts]
    
    def _normalize_contact(self, contact: Dict) -> Dict:
        """Normalize single contact record"""
        return {
            'id': contact.get('id', f"contact_{hash(str(contact))}"),
            'name': contact.get('name', ''),
            'number': contact.get('number', contact.get('phone', '')),
            'email': contact.get('email', ''),
            'role': contact.get('role'),
            '_source': 'parsed'
        }
    
    def _deduplicate(self) -> None:
        """
        Remove duplicate entries based on key fields
        """
        # Deduplicate calls by from+to+datetime
        seen_calls = set()
        unique_calls = []
        for call in self.data['calls']:
            key = (call.get('from'), call.get('to'), call.get('datetime'))
            if key not in seen_calls:
                seen_calls.add(key)
                unique_calls.append(call)
        self.data['calls'] = unique_calls
        
        # Deduplicate messages by from+to+timestamp+body
        seen_messages = set()
        unique_messages = []
        for msg in self.data['messages']:
            key = (msg.get('from'), msg.get('to'), msg.get('timestamp'), msg.get('body'))
            if key not in seen_messages:
                seen_messages.add(key)
                unique_messages.append(msg)
        self.data['messages'] = unique_messages
        
        # Deduplicate locations by lat+lon+timestamp
        seen_locations = set()
        unique_locations = []
        for loc in self.data['locations']:
            key = (loc.get('latitude'), loc.get('longitude'), loc.get('timestamp'))
            if key not in seen_locations:
                seen_locations.add(key)
                unique_locations.append(loc)
        self.data['locations'] = unique_locations
        
        # Deduplicate contacts by number
        seen_contacts = set()
        unique_contacts = []
        for contact in self.data['contacts']:
            key = contact.get('number')
            if key and key not in seen_contacts:
                seen_contacts.add(key)
                unique_contacts.append(contact)
        self.data['contacts'] = unique_contacts
    
    def get_stats(self) -> Dict[str, int]:
        """Get statistics about parsed data"""
        return {
            'calls': len(self.data['calls']),
            'messages': len(self.data['messages']),
            'locations': len(self.data['locations']),
            'contacts': len(self.data['contacts']),
            'browser_history': len(self.data['browser_history']),
            'apps': len(self.data['apps'])
        }


def parse_multi_format_ufdr(directory_path: str) -> Dict[str, Any]:
    """
    Convenience function to parse all formats in a UFDR extraction directory
    """
    parser = MultiFormatParser()
    data = parser.parse_directory(directory_path)
    stats = parser.get_stats()
    
    print(f"Multi-format parsing complete:")
    print(f"  Calls: {stats['calls']}")
    print(f"  Messages: {stats['messages']}")
    print(f"  Locations: {stats['locations']}")
    print(f"  Contacts: {stats['contacts']}")
    print(f"  Browser History: {stats['browser_history']}")
    print(f"  Apps: {stats['apps']}")
    
    return data
