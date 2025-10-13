"""
Cypher Query Generator Service

This service analyzes chat history and generates appropriate Cypher queries
for Neo4j graph visualization based on the context and forensic investigation needs.
"""

from typing import List, Dict, Any, Optional
import re
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

class CypherQueryGenerator:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
        )
    
    def analyze_chat_context(self, chat_history: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Analyze chat history to understand what type of graph visualization would be most relevant.
        
        Args:
            chat_history: List of messages with 'content' and 'sender' keys
            
        Returns:
            Dictionary containing analysis results and suggested graph types
        """
        # Extract key topics and entities from chat
        all_messages = " ".join([msg.get('content', '') for msg in chat_history])
        
        # Define patterns for different investigation types
        patterns = {
            'network_analysis': [
                r'network', r'connection', r'relationship', r'communication',
                r'contact', r'phone', r'email', r'social', r'interaction'
            ],
            'timeline_analysis': [
                r'timeline', r'sequence', r'chronological', r'order', r'time',
                r'when', r'before', r'after', r'during', r'date'
            ],
            'file_analysis': [
                r'file', r'document', r'evidence', r'artifact', r'data',
                r'folder', r'directory', r'attachment', r'media'
            ],
            'entity_analysis': [
                r'person', r'people', r'individual', r'suspect', r'victim',
                r'witness', r'organization', r'company', r'location'
            ],
            'activity_analysis': [
                r'activity', r'action', r'behavior', r'pattern', r'frequency',
                r'usage', r'access', r'login', r'session'
            ]
        }
        
        analysis = {
            'primary_focus': None,
            'secondary_focuses': [],
            'confidence_scores': {},
            'suggested_queries': []
        }
        
        # Calculate relevance scores for each analysis type
        for analysis_type, keywords in patterns.items():
            score = 0
            for keyword in keywords:
                matches = len(re.findall(keyword, all_messages.lower()))
                score += matches
            
            analysis['confidence_scores'][analysis_type] = score
        
        # Determine primary focus
        if analysis['confidence_scores']:
            primary = max(analysis['confidence_scores'], key=analysis['confidence_scores'].get)
            if analysis['confidence_scores'][primary] > 0:
                analysis['primary_focus'] = primary
                
                # Find secondary focuses
                sorted_scores = sorted(analysis['confidence_scores'].items(), 
                                     key=lambda x: x[1], reverse=True)
                for analysis_type, score in sorted_scores[1:]:
                    if score > 0 and score >= analysis['confidence_scores'][primary] * 0.3:
                        analysis['secondary_focuses'].append(analysis_type)
        
        return analysis
    
    def generate_cypher_queries(self, chat_history: List[Dict[str, str]], 
                              analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate appropriate Cypher queries based on chat analysis.
        
        Args:
            chat_history: List of chat messages
            analysis: Analysis results from analyze_chat_context
            
        Returns:
            List of query dictionaries with 'query', 'title', 'description', and 'type'
        """
        queries = []
        
        primary_focus = analysis.get('primary_focus')
        
        if primary_focus == 'network_analysis':
            queries.extend(self._generate_network_queries())
        elif primary_focus == 'timeline_analysis':
            queries.extend(self._generate_timeline_queries())
        elif primary_focus == 'file_analysis':
            queries.extend(self._generate_file_queries())
        elif primary_focus == 'entity_analysis':
            queries.extend(self._generate_entity_queries())
        elif primary_focus == 'activity_analysis':
            queries.extend(self._generate_activity_queries())
        else:
            # Default general queries
            queries.extend(self._generate_general_queries())
        
        # Add secondary focus queries if confidence is high enough
        for secondary_focus in analysis.get('secondary_focuses', []):
            if secondary_focus != primary_focus:
                if secondary_focus == 'network_analysis':
                    queries.extend(self._generate_network_queries()[:1])  # Add just one
                elif secondary_focus == 'entity_analysis':
                    queries.extend(self._generate_entity_queries()[:1])
        
        return queries[:5]  # Limit to 5 queries max
    
    def _generate_network_queries(self) -> List[Dict[str, Any]]:
        """Generate queries focused on network and relationship analysis."""
        return [
            {
                "query": "MATCH (p1:Person)-[r]-(p2:Person) RETURN p1, r, p2 LIMIT 20",
                "title": "Communication Network",
                "description": "Shows communication patterns between individuals",
                "type": "network"
            },
            {
                "query": "MATCH (p:Person)-[r]-(c) WHERE NOT c:Person RETURN p, r, c LIMIT 15",
                "title": "Person Connections",
                "description": "Shows connections from people to other entities",
                "type": "network"
            },
            {
                "query": "MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 25",
                "title": "All Relationships",
                "description": "General view of all relationships in the database",
                "type": "network"
            }
        ]
    
    def _generate_timeline_queries(self) -> List[Dict[str, Any]]:
        """Generate queries focused on timeline and temporal analysis."""
        return [
            {
                "query": "MATCH (e:Event) RETURN e ORDER BY e.timestamp LIMIT 20",
                "title": "Event Timeline",
                "description": "Chronological sequence of events",
                "type": "timeline"
            },
            {
                "query": "MATCH (f:File) WHERE f.created_date IS NOT NULL RETURN f ORDER BY f.created_date LIMIT 15",
                "title": "File Creation Timeline",
                "description": "Files ordered by creation date",
                "type": "timeline"
            }
        ]
    
    def _generate_file_queries(self) -> List[Dict[str, Any]]:
        """Generate queries focused on file and document analysis."""
        return [
            {
                "query": "MATCH (f:File)-[r:CONTAINS]-(d:Data) RETURN f, r, d LIMIT 20",
                "title": "File Contents",
                "description": "Files and their contained data",
                "type": "file"
            },
            {
                "query": "MATCH (f:File)-[r:ACCESSED_BY]-(p:Person) RETURN f, r, p LIMIT 15",
                "title": "File Access Patterns",
                "description": "Who accessed which files",
                "type": "file"
            }
        ]
    
    def _generate_entity_queries(self) -> List[Dict[str, Any]]:
        """Generate queries focused on entity relationships."""
        return [
            {
                "query": "MATCH (p:Person)-[r]-(o) WHERE NOT o:Person RETURN p, r, o LIMIT 20",
                "title": "Person Relationships",
                "description": "People and their connections to other entities",
                "type": "entity"
            },
            {
                "query": "MATCH (l:Location)-[r:VISITED_BY]-(p:Person) RETURN l, r, p LIMIT 15",
                "title": "Location Visits",
                "description": "Locations and their visitors",
                "type": "entity"
            }
        ]
    
    def _generate_activity_queries(self) -> List[Dict[str, Any]]:
        """Generate queries focused on activity and behavior analysis."""
        return [
            {
                "query": "MATCH (a:Activity)-[r:PERFORMED_BY]-(p:Person) RETURN a, r, p ORDER BY a.timestamp DESC LIMIT 20",
                "title": "Recent Activities",
                "description": "Recent activities performed by individuals",
                "type": "activity"
            },
            {
                "query": "MATCH (p:Person)-[r:ACCESSED]-(s:System) RETURN p, r, s LIMIT 15",
                "title": "System Access",
                "description": "System access patterns by users",
                "type": "activity"
            }
        ]
    
    def _generate_general_queries(self) -> List[Dict[str, Any]]:
        """Generate general overview queries when specific focus is unclear."""
        return [
            {
                "query": "MATCH (n) RETURN DISTINCT labels(n) as node_types, count(n) as count ORDER BY count DESC LIMIT 10",
                "title": "Node Overview",
                "description": "Overview of different entity types in the graph",
                "type": "overview"
            },
            {
                "query": "MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 25",
                "title": "General Relationships",
                "description": "General view of relationships in the data",
                "type": "overview"
            },
            {
                "query": "MATCH (n) RETURN n LIMIT 20",
                "title": "All Nodes",
                "description": "Sample of all nodes in the database",
                "type": "overview"
            }
        ]

    def generate_intelligent_queries(self, chat_history: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Use AI to generate more contextually aware queries based on chat history.
        
        Args:
            chat_history: List of chat messages
            
        Returns:
            List of intelligent query suggestions
        """
        # Prepare chat context for AI
        context = ""
        for msg in chat_history[-10:]:  # Last 10 messages for context
            sender = msg.get('sender', 'user')
            content = msg.get('content', '')
            context += f"{sender}: {content}\n"
        
        prompt = f"""
        Based on the following forensic investigation chat history, generate 2-3 Neo4j Cypher queries 
        that would be most relevant for graph visualization. Focus on relationships and patterns 
        that would help with the investigation.
        
        Chat History:
        {context}
        
        For each query, provide:
        1. The Cypher query
        2. A title for the visualization
        3. A brief description
        
        Format as JSON array with objects containing 'query', 'title', 'description' fields.
        Use common forensic node types like Person, File, Event, Location, Communication, Device, etc.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="anthropic/claude-3.5-sonnet",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1500
            )
            
            # Parse AI response to extract queries
            ai_content = response.choices[0].message.content
            
            # Try to extract JSON from the response
            import json
            import re
            
            # Look for JSON array in the response
            json_match = re.search(r'\[.*\]', ai_content, re.DOTALL)
            if json_match:
                queries_data = json.loads(json_match.group())
                
                # Validate and format the queries
                formatted_queries = []
                for query_data in queries_data:
                    if all(key in query_data for key in ['query', 'title', 'description']):
                        formatted_queries.append({
                            'query': query_data['query'].strip(),
                            'title': query_data['title'],
                            'description': query_data['description'],
                            'type': 'ai_generated'
                        })
                
                return formatted_queries
                
        except Exception as e:
            print(f"Error generating AI queries: {e}")
            
        # Fallback to rule-based queries
        analysis = self.analyze_chat_context(chat_history)
        return self.generate_cypher_queries(chat_history, analysis)

def generate_graph_queries(chat_history: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Main function to generate graph queries from chat history.
    
    Args:
        chat_history: List of chat messages
        
    Returns:
        Dictionary containing analysis and generated queries
    """
    generator = CypherQueryGenerator()
    
    # Analyze chat context
    analysis = generator.analyze_chat_context(chat_history)
    
    # Generate rule-based queries
    rule_based_queries = generator.generate_cypher_queries(chat_history, analysis)
    
    # Generate AI-enhanced queries
    ai_queries = generator.generate_intelligent_queries(chat_history)
    
    # Combine and deduplicate
    all_queries = ai_queries + rule_based_queries
    
    # Remove duplicates based on query similarity
    unique_queries = []
    seen_titles = set()
    
    for query in all_queries:
        if query['title'] not in seen_titles:
            unique_queries.append(query)
            seen_titles.add(query['title'])
    
    return {
        'analysis': analysis,
        'queries': unique_queries[:5],  # Limit to 5 queries
        'total_queries': len(unique_queries)
    }