// Backend service for connecting to the Python FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface UploadResponse {
  message: string;
  chunks: number;
  session_id: string;
}

export interface QueryResponse {
  query: string;
  response: string;
  context_used: boolean;
  session_id: string;
  detected_language?: string;
  language_instruction?: string;
}

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
  type: string;
  name: string;
}

export interface GraphRelationship {
  id: string;
  type: string;
  properties: Record<string, any>;
  start_node: string;
  end_node: string;
  relationship_type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  node_count: number;
  relationship_count: number;
}

export interface SuggestedQuery {
  query: string;
  title: string;
  description: string;
  type: string;
}

export interface GraphAnalysis {
  primary_focus: string | null;
  secondary_focuses: string[];
  confidence_scores: Record<string, number>;
}

export interface GraphGenerationResponse {
  success: boolean;
  session_id: string;
  analysis: GraphAnalysis;
  suggested_queries: SuggestedQuery[];
  executed_query: SuggestedQuery | null;
  graph_data: GraphData;
  database_stats: Record<string, any>;
  total_messages_analyzed: number;
  error?: string;
  mock_data?: boolean;
}

export interface QueryExecutionResponse {
  success: boolean;
  session_id: string;
  query: string;
  graph_data: GraphData;
  error?: string;
}

export interface DatabaseStatsResponse {
  success: boolean;
  stats: {
    total_nodes: number;
    total_relationships: number;
    node_counts_by_label: Record<string, number>;
    relationship_counts_by_type: Record<string, number>;
  };
  error?: string;
}

export interface ApiError {
  detail: string;
}

/**
 * Upload a UFDR file to the backend for processing
 */
export async function uploadUFDRFile(
  file: File,
  sessionId: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);

  const response = await fetch(`${API_BASE_URL}/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to upload file");
  }

  return response.json();
}

/**
 * Query the uploaded documents using AI
 */
export async function queryDocuments(
  query: string,
  sessionId: string,
  language?: string
): Promise<QueryResponse> {
  const formData = new FormData();
  formData.append("query", query);
  formData.append("session_id", sessionId);
  if (language) {
    formData.append("language", language);
  }

  const response = await fetch(`${API_BASE_URL}/query/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to query documents");
  }

  return response.json();
}

/**
 * Generate a unique session ID for a case
 */
export function generateSessionId(caseId: string): string {
  return `case_${caseId}_${Date.now()}`;
}

/**
 * Check if the backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate Neo4j graph visualization based on chat history
 */
export async function generateGraph(
  chatHistory: Array<{ content: string; sender: string; timestamp?: string }>,
  sessionId: string
): Promise<GraphGenerationResponse> {
  try {
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("chat_history", JSON.stringify(chatHistory));

    const response = await fetch(`${API_BASE_URL}/generate-graph/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || "Failed to generate graph");
    }

    return response.json();
  } catch (error) {
    console.error("Error generating graph:", error);
    
    // Check if it's a network error (backend not running)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Backend service is not running. Please start the Python backend server on port 8000.");
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Execute a custom Cypher query
 */
export async function executeCustomQuery(
  cypherQuery: string,
  sessionId: string
): Promise<QueryExecutionResponse> {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("cypher_query", cypherQuery);

  const response = await fetch(`${API_BASE_URL}/execute-query/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to execute query");
  }

  return response.json();
}

/**
 * Get database statistics and overview
 */
export async function getDatabaseStats(): Promise<DatabaseStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/database-stats/`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to get database stats");
  }

  return response.json();
}

/**
 * Save graph data to localStorage for a specific case
 */
export function saveGraphData(caseId: string, graphData: GraphData): void {
  try {
    const key = `graph_data_${caseId}`;
    localStorage.setItem(key, JSON.stringify({
      ...graphData,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Error saving graph data:", error);
  }
}

/**
 * Load graph data from localStorage for a specific case
 */
export function loadGraphData(caseId: string): GraphData | null {
  try {
    const key = `graph_data_${caseId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      // Return data without timestamp
      const { timestamp, ...graphData } = data;
      return graphData;
    }
  } catch (error) {
    console.error("Error loading graph data:", error);
  }
  return null;
}

/**
 * Clear stored graph data for a specific case
 */
export function clearGraphData(caseId: string): void {
  try {
    const key = `graph_data_${caseId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing graph data:", error);
  }
}

/**
 * Get the timestamp of the last graph generation for a case
 */
export function getGraphDataTimestamp(caseId: string): string | null {
  try {
    const key = `graph_data_${caseId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      return data.timestamp || null;
    }
  } catch (error) {
    console.error("Error getting graph data timestamp:", error);
  }
  return null;
}
