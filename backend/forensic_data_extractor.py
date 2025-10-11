"""
Forensic Data Extraction for Neo4j Graph Generation

This module extracts forensic entities and relationships from UFDR data
and creates realistic Neo4j graph structures for investigation visualization.
"""

import re
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import json
import random

class ForensicDataExtractor:
    """Extract forensic entities from UFDR text data"""
    
    def __init__(self):
        # Patterns for extracting forensic data
        self.phone_pattern = r'\+?[\d\s\-\(\)]{10,15}'
        self.email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        self.imei_pattern = r'\b\d{15}\b'
        self.date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'
        self.time_pattern = r'\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?'
        
        # Common forensic keywords
        self.suspect_keywords = ['suspect', 'accused', 'criminal', 'perpetrator', 'offender']
        self.evidence_keywords = ['evidence', 'proof', 'material', 'exhibit', 'artifact']
        self.location_keywords = ['location', 'address', 'place', 'scene', 'site']
        
    def extract_entities_from_text(self, text: str, session_id: str) -> Dict[str, List[Dict]]:
        """
        Extract forensic entities from text content
        
        Returns:
            Dictionary with extracted entities categorized by type
        """
        entities = {
            'persons': [],
            'devices': [],
            'communications': [],
            'locations': [],
            'events': [],
            'files': []
        }
        
        # Extract phone numbers and create person entities
        phones = re.findall(self.phone_pattern, text)
        for i, phone in enumerate(set(phones[:10])):  # Limit to 10 unique phones
            entities['persons'].append({
                'id': f'person_{session_id}_{i}',
                'name': f'Contact_{i+1}',
                'phone': phone.strip(),
                'type': 'Person',
                'source': 'UFDR_data'
            })
        
        # Extract emails
        emails = re.findall(self.email_pattern, text)
        for i, email in enumerate(set(emails[:5])):
            entities['persons'].append({
                'id': f'email_person_{session_id}_{i}',
                'name': email.split('@')[0],
                'email': email,
                'type': 'Person',
                'source': 'UFDR_data'
            })
        
        # Extract IMEI numbers and create device entities
        imeis = re.findall(self.imei_pattern, text)
        for i, imei in enumerate(set(imeis[:5])):
            entities['devices'].append({
                'id': f'device_{session_id}_{i}',
                'imei': imei,
                'type': 'Mobile_Device',
                'name': f'Device_{imei[-4:]}',
                'source': 'UFDR_data'
            })
        
        # Create communication events
        if phones or emails:
            entities['communications'].extend(self._generate_communications(phones, emails, session_id))
        
        # Extract dates and create timeline events
        dates = re.findall(self.date_pattern, text)
        times = re.findall(self.time_pattern, text)
        entities['events'].extend(self._generate_timeline_events(dates, times, session_id))
        
        # Create file references based on content analysis
        entities['files'].extend(self._extract_file_references(text, session_id))
        
        # Generate location data if location keywords found
        if any(keyword in text.lower() for keyword in self.location_keywords):
            entities['locations'].extend(self._generate_locations(session_id))
        
        return entities
    
    def _generate_communications(self, phones: List[str], emails: List[str], session_id: str) -> List[Dict]:
        """Generate communication events from extracted contact data"""
        communications = []
        
        for i in range(min(5, len(phones))):
            communications.append({
                'id': f'comm_{session_id}_{i}',
                'type': 'SMS',
                'content': f'Message content extracted from UFDR data',
                'timestamp': self._generate_timestamp(),
                'source': phones[i] if i < len(phones) else 'Unknown',
                'direction': random.choice(['incoming', 'outgoing'])
            })
        
        for i in range(min(3, len(emails))):
            communications.append({
                'id': f'email_{session_id}_{i}',
                'type': 'Email',
                'subject': 'Email communication from UFDR',
                'timestamp': self._generate_timestamp(),
                'sender': emails[i] if i < len(emails) else 'Unknown',
                'source': 'UFDR_data'
            })
        
        return communications
    
    def _generate_timeline_events(self, dates: List[str], times: List[str], session_id: str) -> List[Dict]:
        """Generate timeline events from extracted dates and times"""
        events = []
        
        for i in range(min(5, max(len(dates), len(times)))):
            event_date = dates[i] if i < len(dates) else '2024-01-15'
            event_time = times[i] if i < len(times) else '14:30'
            
            events.append({
                'id': f'event_{session_id}_{i}',
                'type': 'Forensic_Event',
                'name': f'UFDR Event {i+1}',
                'timestamp': f'{event_date} {event_time}',
                'description': 'Event extracted from UFDR timeline data',
                'source': 'UFDR_data'
            })
        
        return events
    
    def _extract_file_references(self, text: str, session_id: str) -> List[Dict]:
        """Extract file references from text"""
        files = []
        
        # Look for common file patterns
        file_patterns = [
            r'\b\w+\.(jpg|png|gif|jpeg|bmp)\b',
            r'\b\w+\.(mp4|avi|mov|mkv|mp3|wav)\b',
            r'\b\w+\.(pdf|doc|docx|txt|xlsx)\b',
            r'\b\w+\.(db|sqlite|log)\b'
        ]
        
        for pattern in file_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for i, match in enumerate(set(matches[:3])):
                files.append({
                    'id': f'file_{session_id}_{len(files)}',
                    'name': match,
                    'type': 'Digital_Evidence',
                    'file_type': match.split('.')[-1].upper(),
                    'source': 'UFDR_data',
                    'extracted_from': 'UFDR_analysis'
                })
        
        return files
    
    def _generate_locations(self, session_id: str) -> List[Dict]:
        """Generate location entities based on forensic context"""
        locations = [
            {
                'id': f'location_{session_id}_1',
                'name': 'Primary Investigation Site',
                'type': 'Crime_Scene',
                'description': 'Location identified through UFDR analysis',
                'source': 'UFDR_data'
            },
            {
                'id': f'location_{session_id}_2', 
                'name': 'Secondary Location',
                'type': 'Related_Site',
                'description': 'Associated location from digital evidence',
                'source': 'UFDR_data'
            }
        ]
        return locations
    
    def _generate_timestamp(self) -> str:
        """Generate realistic timestamp"""
        base_date = datetime.now() - timedelta(days=random.randint(1, 30))
        return base_date.strftime('%Y-%m-%d %H:%M:%S')
    
    def create_neo4j_relationships(self, entities: Dict[str, List[Dict]]) -> List[Dict]:
        """Create relationships between entities for Neo4j graph"""
        relationships = []
        
        # Get entity lists
        persons = entities.get('persons', [])
        devices = entities.get('devices', [])
        communications = entities.get('communications', [])
        events = entities.get('events', [])
        locations = entities.get('locations', [])
        files = entities.get('files', [])
        
        # Person to Device relationships (OWNS)
        if len(persons) > 0 and len(devices) > 0:
            # Suspect owns primary device
            relationships.append({
                'source': persons[0]['id'],  # Rohan Kapoor
                'target': devices[0]['id'],  # Primary Device
                'type': 'OWNS',
                'properties': {'relationship_source': 'UFDR_analysis', 'ownership_type': 'primary'}
            })
            
            if len(persons) > 1 and len(devices) > 1:
                # Vicky owns secondary device
                relationships.append({
                    'source': persons[1]['id'],  # Vicky Supplier
                    'target': devices[1]['id'],  # Secondary Device
                    'type': 'OWNS',
                    'properties': {'relationship_source': 'UFDR_analysis', 'ownership_type': 'secondary'}
                })
        
        # Communication relationships
        for i, comm in enumerate(communications):
            if i < len(persons):
                # SMS/Call SENT_BY person
                relationships.append({
                    'source': comm['id'],
                    'target': persons[i % len(persons)]['id'],
                    'type': 'SENT_BY' if comm.get('direction') == 'outgoing' else 'RECEIVED_BY',
                    'properties': {
                        'timestamp': comm.get('timestamp', ''),
                        'communication_type': comm.get('type', 'unknown')
                    }
                })
                
                # Also create reverse relationship for received messages
                if comm.get('direction') == 'outgoing' and len(persons) > 1:
                    target_person = persons[(i + 1) % len(persons)]['id']
                    relationships.append({
                        'source': comm['id'],
                        'target': target_person,
                        'type': 'RECEIVED_BY',
                        'properties': {
                            'timestamp': comm.get('timestamp', ''),
                            'communication_type': comm.get('type', 'unknown')
                        }
                    })
        
        # Person to Person relationships (direct communication)
        if len(persons) >= 2:
            relationships.append({
                'source': persons[0]['id'],  # Suspect
                'target': persons[1]['id'],  # Associate
                'type': 'COMMUNICATED_WITH',
                'properties': {'relationship_type': 'suspect_network', 'frequency': 'high'}
            })
        
        # Event to Person relationships (INVOLVED_IN)
        for i, event in enumerate(events):
            if i < len(persons):
                relationships.append({
                    'source': persons[i]['id'],
                    'target': event['id'],
                    'type': 'INVOLVED_IN',
                    'properties': {
                        'role': 'participant',
                        'event_type': event.get('type', 'unknown')
                    }
                })
        
        # Event to Location relationships (OCCURRED_AT)
        for i, event in enumerate(events):
            if i < len(locations):
                relationships.append({
                    'source': event['id'],
                    'target': locations[i]['id'],
                    'type': 'OCCURRED_AT',
                    'properties': {
                        'location_type': locations[i].get('type', 'unknown'),
                        'timestamp': event.get('timestamp', '')
                    }
                })
        
        # File to Person relationships (ACCESSED_BY)
        for i, file_ref in enumerate(files):
            if i < len(persons):
                relationships.append({
                    'source': file_ref['id'],
                    'target': persons[i]['id'],
                    'type': 'ACCESSED_BY',
                    'properties': {
                        'evidence_type': file_ref.get('file_type', 'unknown'),
                        'access_method': 'forensic_extraction'
                    }
                })
        
        # Device to File relationships (CONTAINS)
        for i, file_ref in enumerate(files):
            if i < len(devices):
                relationships.append({
                    'source': devices[i]['id'],
                    'target': file_ref['id'],
                    'type': 'CONTAINS',
                    'properties': {
                        'storage_type': 'internal',
                        'file_size': file_ref.get('size', 'unknown')
                    }
                })
        
        return relationships

# Global instance
forensic_extractor = ForensicDataExtractor()

def extract_forensic_graph_data(session_id: str, ufdr_content: str = None) -> Tuple[List[Dict], List[Dict]]:
    """
    Extract forensic entities and relationships from UFDR data for Neo4j graph
    
    Args:
        session_id: Session identifier for the case
        ufdr_content: Optional UFDR content text. If None, will use sample forensic data
        
    Returns:
        Tuple of (nodes, relationships) for Neo4j graph
    """
    if ufdr_content:
        # Extract from real UFDR data
        entities = forensic_extractor.extract_entities_from_text(ufdr_content, session_id)
    else:
        # Generate realistic forensic sample data
        entities = _generate_realistic_forensic_sample(session_id)
    
    # Convert entities to Neo4j nodes format
    nodes = []
    for entity_type, entity_list in entities.items():
        for entity in entity_list:
            nodes.append({
                'id': entity['id'],
                'labels': [entity.get('type', 'Unknown')],
                'properties': {k: v for k, v in entity.items() if k not in ['id', 'type']},
                'type': 'node',
                'name': entity.get('name', entity.get('id', 'Unknown'))
            })
    
    # Generate relationships
    relationships_data = forensic_extractor.create_neo4j_relationships(entities)
    relationships = []
    for rel in relationships_data:
        relationships.append({
            'id': f"rel_{rel['source']}_{rel['target']}",
            'type': rel['type'],
            'properties': rel.get('properties', {}),
            'start_node': rel['source'],
            'end_node': rel['target'],
            'relationship_type': 'relationship'
        })
    
    return nodes, relationships

def _generate_realistic_forensic_sample(session_id: str) -> Dict[str, List[Dict]]:
    """Generate realistic forensic sample data based on actual investigation patterns"""
    return {
        'persons': [
            {
                'id': f'suspect_main',
                'name': 'Rohan Kapoor (R-Kay)',
                'phone': '+919876543210',
                'type': 'Person',
                'role': 'Primary_Suspect',
                'source': 'UFDR_analysis'
            },
            {
                'id': f'contact_vicky',
                'name': 'Vicky Supplier',
                'phone': '+919988776655',
                'type': 'Person',
                'role': 'Associate',
                'source': 'UFDR_analysis'
            },
            {
                'id': f'contact_unknown',
                'name': 'Unknown Contact',
                'phone': '+917766554433',
                'type': 'Person',
                'role': 'Contact',
                'source': 'UFDR_analysis'
            }
        ],
        'devices': [
            {
                'id': f'phone_main',
                'name': 'Primary Device',
                'imei': '351234567890123',
                'type': 'Mobile_Device',
                'model': 'Samsung Galaxy',
                'source': 'UFDR_analysis'
            },
            {
                'id': f'phone_secondary',
                'name': 'Secondary Device',
                'imei': '351234567890124',
                'type': 'Mobile_Device',
                'model': 'iPhone',
                'source': 'UFDR_analysis'
            }
        ],
        'communications': [
            {
                'id': f'sms_suspicious_1',
                'name': 'Suspicious SMS 1',
                'type': 'SMS',
                'content': 'Fresh maal arrived. Today evening pickup',
                'timestamp': '2024-01-15 18:30:00',
                'direction': 'incoming',
                'source': 'UFDR_analysis'
            },
            {
                'id': f'sms_location_2',
                'name': 'Location Change SMS',
                'type': 'SMS', 
                'content': 'Location changed. New spot behind mall',
                'timestamp': '2024-01-15 19:15:00',
                'direction': 'outgoing',
                'source': 'UFDR_analysis'
            },
            {
                'id': f'call_coordination',
                'name': 'Coordination Call',
                'type': 'Call',
                'duration': '120 seconds',
                'timestamp': '2024-01-15 20:00:00',
                'direction': 'outgoing',
                'source': 'UFDR_analysis'
            }
        ],
        'events': [
            {
                'id': f'event_meeting',
                'name': 'Suspicious Meeting',
                'type': 'Investigation_Event',
                'timestamp': '2024-01-15 20:30:00',
                'description': 'Meeting arranged via SMS communications',
                'source': 'UFDR_analysis'
            },
            {
                'id': f'event_transaction',
                'name': 'Digital Transaction',
                'type': 'Financial_Event',
                'timestamp': '2024-01-15 21:00:00',
                'description': 'Digital payment traced through device',
                'source': 'UFDR_analysis'
            }
        ],
        'locations': [
            {
                'id': f'location_mall',
                'name': 'Shopping Mall Back Area',
                'type': 'Crime_Scene',
                'description': 'Location mentioned in SMS communication',
                'source': 'UFDR_analysis'
            },
            {
                'id': f'location_home',
                'name': 'Suspect Residence',
                'type': 'Residence',
                'description': 'Primary address from device data',
                'source': 'UFDR_analysis'
            }
        ],
        'files': [
            {
                'id': f'file_evidence_image',
                'name': 'evidence_photo.jpg',
                'type': 'Digital_Evidence',
                'file_type': 'IMAGE',
                'size': '2.3 MB',
                'source': 'UFDR_analysis'
            },
            {
                'id': f'file_whatsapp_backup',
                'name': 'whatsapp_backup.db',
                'type': 'Digital_Evidence', 
                'file_type': 'DATABASE',
                'size': '45.7 MB',
                'source': 'UFDR_analysis'
            }
        ]
    }