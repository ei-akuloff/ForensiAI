"""
Neo4j Service for Forensic Investigation Graph Database

This service handles connections to Neo4j database and executes Cypher queries
for graph visualization in forensic investigations.
"""

from neo4j import GraphDatabase, exceptions
from typing import List, Dict, Any, Optional, Tuple
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Neo4jService:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI")
        self.username = os.getenv("NEO4J_USERNAME")
        self.password = os.getenv("NEO4J_PASSWORD")
        self.driver = None
        
        if not all([self.uri, self.username, self.password]):
            raise ValueError("Neo4j credentials not found in environment variables")
    
    def connect(self) -> bool:
        """
        Establish connection to Neo4j database.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            self.driver = GraphDatabase.driver(
                self.uri, 
                auth=(self.username, self.password),
                connection_timeout=30,
                max_connection_lifetime=3600
            )
            
            # Test the connection
            with self.driver.session() as session:
                result = session.run("RETURN 1 as test")
                test_value = result.single()["test"]
                if test_value == 1:
                    logger.info("Successfully connected to Neo4j database")
                    return True
                    
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            return False
        
        return False
    
    def close(self):
        """Close the database connection."""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed")
    
    def execute_query(self, query: str, parameters: Dict[str, Any] = None) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Execute a Cypher query and return nodes and relationships for graph visualization.
        
        Args:
            query: Cypher query string
            parameters: Optional query parameters
            
        Returns:
            Tuple of (nodes, relationships) as lists of dictionaries
        """
        if not self.driver:
            if not self.connect():
                raise ConnectionError("Cannot connect to Neo4j database")
        
        nodes = []
        relationships = []
        node_ids = set()
        
        try:
            with self.driver.session() as session:
                result = session.run(query, parameters or {})
                
                for record in result:
                    # Process each record and extract nodes and relationships
                    for key, value in record.items():
                        if hasattr(value, 'labels'):  # This is a node
                            node_id = str(value.id)
                            if node_id not in node_ids:
                                node_data = {
                                    'id': node_id,
                                    'labels': list(value.labels),
                                    'properties': dict(value.items()),
                                    'type': 'node'
                                }
                                # Add a display name for the node
                                node_data['name'] = self._get_node_display_name(node_data)
                                nodes.append(node_data)
                                node_ids.add(node_id)
                        
                        elif hasattr(value, 'type'):  # This is a relationship
                            rel_data = {
                                'id': str(value.id),
                                'type': value.type,
                                'properties': dict(value.items()),
                                'start_node': str(value.start_node.id),
                                'end_node': str(value.end_node.id),
                                'relationship_type': 'relationship'
                            }
                            relationships.append(rel_data)
                
                logger.info(f"Query executed successfully. Found {len(nodes)} nodes and {len(relationships)} relationships")
                
        except exceptions.CypherSyntaxError as e:
            logger.error(f"Cypher syntax error: {e}")
            raise ValueError(f"Invalid Cypher query: {e}")
        except exceptions.ClientError as e:
            logger.error(f"Neo4j client error: {e}")
            raise ConnectionError(f"Database error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error executing query: {e}")
            raise RuntimeError(f"Query execution failed: {e}")
        
        return nodes, relationships
    
    def _get_node_display_name(self, node_data: Dict[str, Any]) -> str:
        """
        Generate a display name for a node based on its properties and labels.
        
        Args:
            node_data: Node data dictionary
            
        Returns:
            String to display as node name
        """
        props = node_data.get('properties', {})
        labels = node_data.get('labels', [])
        
        # Try common name properties
        for name_prop in ['name', 'title', 'filename', 'email', 'phone', 'address', 'content']:
            if name_prop in props and props[name_prop]:
                return str(props[name_prop])[:50]  # Limit length
        
        # Try ID-based properties
        for id_prop in ['id', 'user_id', 'file_id', 'person_id']:
            if id_prop in props and props[id_prop]:
                return f"{labels[0] if labels else 'Node'}: {props[id_prop]}"
        
        # Fallback to label or node ID
        if labels:
            return f"{labels[0]}_{node_data['id'][:8]}"
        
        return f"Node_{node_data['id'][:8]}"
    
    def get_database_stats(self) -> Dict[str, Any]:
        """
        Get basic statistics about the database for overview.
        
        Returns:
            Dictionary with database statistics
        """
        if not self.driver:
            if not self.connect():
                raise ConnectionError("Cannot connect to Neo4j database")
        
        stats = {}
        
        try:
            with self.driver.session() as session:
                # Get node counts by label
                node_counts_result = session.run("""
                    CALL db.labels() YIELD label
                    CALL apoc.cypher.run('MATCH (n:' + label + ') RETURN count(n) as count', {}) YIELD value
                    RETURN label, value.count as count
                """)
                
                node_counts = {}
                total_nodes = 0
                for record in node_counts_result:
                    label = record["label"]
                    count = record["count"]
                    node_counts[label] = count
                    total_nodes += count
                
                # Get relationship counts by type
                rel_counts_result = session.run("""
                    CALL db.relationshipTypes() YIELD relationshipType
                    CALL apoc.cypher.run('MATCH ()-[r:' + relationshipType + ']->() RETURN count(r) as count', {}) YIELD value
                    RETURN relationshipType, value.count as count
                """)
                
                rel_counts = {}
                total_rels = 0
                for record in rel_counts_result:
                    rel_type = record["relationshipType"]
                    count = record["count"]
                    rel_counts[rel_type] = count
                    total_rels += count
                
                stats = {
                    'total_nodes': total_nodes,
                    'total_relationships': total_rels,
                    'node_counts_by_label': node_counts,
                    'relationship_counts_by_type': rel_counts
                }
                
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            # Fallback to simple counts
            try:
                with self.driver.session() as session:
                    nodes_result = session.run("MATCH (n) RETURN count(n) as total_nodes")
                    rels_result = session.run("MATCH ()-[r]->() RETURN count(r) as total_rels")
                    
                    stats = {
                        'total_nodes': nodes_result.single()["total_nodes"],
                        'total_relationships': rels_result.single()["total_rels"],
                        'node_counts_by_label': {},
                        'relationship_counts_by_type': {}
                    }
            except Exception as fallback_error:
                logger.error(f"Error in fallback stats query: {fallback_error}")
                stats = {
                    'total_nodes': 0,
                    'total_relationships': 0,
                    'node_counts_by_label': {},
                    'relationship_counts_by_type': {}
                }
        
        return stats
    
    def create_sample_data(self) -> bool:
        """
        Create realistic forensic investigation data for demonstration.
        Only creates data if the database is empty.
        
        Returns:
            bool: True if sample data was created, False otherwise
        """
        if not self.driver:
            if not self.connect():
                raise ConnectionError("Cannot connect to Neo4j database")
        
        try:
            with self.driver.session() as session:
                # Check if data already exists
                result = session.run("MATCH (n) RETURN count(n) as count")
                node_count = result.single()["count"]
                
                if node_count > 0:
                    logger.info("Database already contains data, skipping sample data creation")
                    return False
                
                # Import forensic data extractor
                from forensic_data_extractor import extract_forensic_graph_data
                
                # Generate realistic forensic data
                session_id = "forensic_sample"
                nodes, relationships = extract_forensic_graph_data(session_id)
                
                # Clear any existing data first
                session.run("MATCH (n) DETACH DELETE n")
                
                # Create nodes
                for node in nodes:
                    labels = ":".join(node['labels'])
                    properties_str = ", ".join([f"{k}: ${k}" for k in node['properties'].keys()])
                    
                    query = f"""
                    CREATE (n:{labels} {{id: $id, name: $name, {properties_str}}})
                    """
                    
                    params = {
                        'id': node['id'],
                        'name': node['name'],
                        **node['properties']
                    }
                    
                    session.run(query, params)
                
                # Create relationships
                for rel in relationships:
                    query = f"""
                    MATCH (a {{id: $start_id}}), (b {{id: $end_id}})
                    CREATE (a)-[r:{rel['type']} {{id: $rel_id}}]->(b)
                    SET r += $properties
                    """
                    
                    params = {
                        'start_id': rel['start_node'],
                        'end_id': rel['end_node'],
                        'rel_id': rel['id'],
                        'properties': rel.get('properties', {})
                    }
                    
                    session.run(query, params)
                
                logger.info(f"Created {len(nodes)} forensic nodes and {len(relationships)} relationships")
                return True
                
        except Exception as e:
            logger.error(f"Error creating forensic sample data: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def validate_query(self, query: str) -> Tuple[bool, str]:
        """
        Validate a Cypher query without executing it.
        
        Args:
            query: Cypher query string
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            if not self.driver:
                if not self.connect():
                    return False, "Cannot connect to Neo4j database"
            
            with self.driver.session() as session:
                # Use EXPLAIN to validate query syntax without executing
                result = session.run(f"EXPLAIN {query}")
                result.consume()  # Consume the result to trigger any syntax errors
                return True, "Query is valid"
                
        except exceptions.CypherSyntaxError as e:
            return False, f"Syntax error: {str(e)}"
        except Exception as e:
            return False, f"Validation error: {str(e)}"

# Global instance
neo4j_service = Neo4jService()

def get_neo4j_service() -> Neo4jService:
    """Get the global Neo4j service instance."""
    return neo4j_service

def execute_cypher_query(query: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Execute a Cypher query and return formatted results for graph visualization.
    
    Args:
        query: Cypher query string
        parameters: Optional query parameters
        
    Returns:
        Dictionary containing nodes, relationships, and metadata
    """
    service = get_neo4j_service()
    
    try:
        nodes, relationships = service.execute_query(query, parameters)
        
        return {
            'success': True,
            'nodes': nodes,
            'relationships': relationships,
            'node_count': len(nodes),
            'relationship_count': len(relationships),
            'query': query
        }
        
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        return {
            'success': False,
            'error': str(e),
            'nodes': [],
            'relationships': [],
            'node_count': 0,
            'relationship_count': 0,
            'query': query
        }

def get_database_overview() -> Dict[str, Any]:
    """
    Get database overview and statistics.
    
    Returns:
        Dictionary with database statistics and overview
    """
    service = get_neo4j_service()
    
    try:
        stats = service.get_database_stats()
        return {
            'success': True,
            'stats': stats
        }
    except Exception as e:
        logger.error(f"Error getting database overview: {e}")
        return {
            'success': False,
            'error': str(e),
            'stats': {}
        }