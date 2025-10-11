"""
Neo4j Cypher Query Validator

This module validates and sanitizes Cypher queries to prevent syntax errors
and ensure they work with the forensic investigation database.
"""

import re
from typing import List, Dict, Any, Optional

class CypherQueryValidator:
    """Validates and sanitizes Neo4j Cypher queries for forensic investigation."""
    
    def __init__(self):
        # Safe, tested queries that are guaranteed to work
        self.safe_queries = {
            "all_nodes": "MATCH (n) RETURN n LIMIT 20",
            "all_relationships": "MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 25",
            "person_network": "MATCH (p:Person)-[r]-(other) RETURN p, r, other LIMIT 20",
            "node_types": "MATCH (n) RETURN DISTINCT labels(n) as node_types, count(n) as count ORDER BY count DESC LIMIT 10",
            "communications": "MATCH (n) WHERE n:SMS OR n:Call OR n:Email RETURN n LIMIT 15",
            "devices": "MATCH (d:Mobile_Device)-[r]-(p:Person) RETURN d, r, p LIMIT 15"
        }
    
    def validate_query(self, query: str) -> Dict[str, Any]:
        """
        Validate a Cypher query for syntax and safety.
        
        Args:
            query: The Cypher query to validate
            
        Returns:
            Dictionary with validation results
        """
        result = {
            "is_valid": False,
            "sanitized_query": None,
            "errors": [],
            "warnings": []
        }
        
        # Clean the query
        cleaned_query = self._clean_query(query)
        
        # Check for common syntax issues
        syntax_errors = self._check_syntax_errors(cleaned_query)
        if syntax_errors:
            result["errors"].extend(syntax_errors)
            # Try to use a safe fallback query
            result["sanitized_query"] = self.safe_queries["all_relationships"]
            result["warnings"].append("Using safe fallback query due to syntax errors")
        else:
            result["is_valid"] = True
            result["sanitized_query"] = cleaned_query
        
        return result
    
    def _clean_query(self, query: str) -> str:
        """Clean and normalize a Cypher query."""
        # Remove extra whitespace and newlines
        cleaned = re.sub(r'\s+', ' ', query.strip())
        
        # Remove any dangerous operations
        dangerous_patterns = [
            r'DELETE\s+',
            r'DETACH\s+DELETE\s+',
            r'CREATE\s+(?!.*RETURN)',  # CREATE without RETURN
            r'MERGE\s+(?!.*RETURN)',   # MERGE without RETURN
            r'SET\s+',
            r'REMOVE\s+'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, cleaned, re.IGNORECASE):
                # Replace with safe query
                return self.safe_queries["all_relationships"]
        
        return cleaned
    
    def _check_syntax_errors(self, query: str) -> List[str]:
        """Check for common Cypher syntax errors."""
        errors = []
        
        # Check for unmatched parentheses
        if query.count('(') != query.count(')'):
            errors.append("Unmatched parentheses in query")
        
        # Check for unmatched brackets
        if query.count('[') != query.count(']'):
            errors.append("Unmatched brackets in query")
        
        # Check for unmatched curly braces
        if query.count('{') != query.count('}'):
            errors.append("Unmatched curly braces in query")
        
        # Check for invalid relationship syntax
        invalid_rel_patterns = [
            r'\*\d+\.\.\d+\]->',  # Complex path patterns that might fail
            r'CASE\s+WHEN.*r:',   # Invalid CASE syntax with relationships
            r'\$\w+',             # Parameters that might not be provided
        ]
        
        for pattern in invalid_rel_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                errors.append(f"Potentially problematic pattern: {pattern}")
        
        return errors
    
    def get_safe_query(self, query_type: str = "all_relationships") -> str:
        """Get a safe, tested query by type."""
        return self.safe_queries.get(query_type, self.safe_queries["all_relationships"])
    
    def get_forensic_queries(self) -> List[Dict[str, Any]]:
        """Get a list of safe, validated forensic investigation queries."""
        return [
            {
                "query": self.safe_queries["person_network"],
                "title": "Person Network",
                "description": "Shows connections between persons and other entities",
                "type": "forensic"
            },
            {
                "query": self.safe_queries["communications"],
                "title": "Communications",
                "description": "Shows SMS, calls, and email messages",
                "type": "communication"
            },
            {
                "query": self.safe_queries["devices"],
                "title": "Device Connections",
                "description": "Shows mobile devices and their owners",
                "type": "device"
            },
            {
                "query": self.safe_queries["node_types"],
                "title": "Entity Overview",
                "description": "Overview of all entity types in the investigation",
                "type": "overview"
            },
            {
                "query": self.safe_queries["all_relationships"],
                "title": "All Relationships",
                "description": "General view of relationships in the data",
                "type": "network"
            }
        ]