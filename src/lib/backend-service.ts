// Backend service for connecting to the Python FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface UploadResponse {
  message: string;
  chunks: number;
  session_id: string;
  file_type?: string;
}

export interface MultipleUploadResponse {
  message: string;
  total_chunks: number;
  session_id: string;
  files_processed: string[];
}

export interface UFDRContentsResponse {
  message: string;
  files: Array<{
    name: string;
    type: string;
    size: number;
    path: string;
    directory: string;
  }>;
  total_files: number;
}

export interface QueryResponse {
  query: string;
  response: string;
  context_used: boolean;
  session_id: string;
  detected_language?: string;
  language_instruction?: string;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  type: "contact" | "caller" | "chat_participant";
  frequency: "high" | "medium" | "low";
  suspicious: boolean;
}

export interface Relationship {
  from: string;
  to: string;
  type: "family" | "friend" | "business" | "suspicious" | "unknown";
  strength: "strong" | "medium" | "weak";
  evidence: string;
  communication_count: number;
  last_interaction?: string;
}

export interface RelationshipAnalysis {
  people: Person[];
  relationships: Relationship[];
  summary: string;
}

export interface RelationshipResponse {
  message: string;
  session_id: string;
  analysis: RelationshipAnalysis;
}

export interface Communication {
  type: string;
  timestamp?: string;
  content: string;
  direction: string;
  suspicious: boolean;
  platform: string;
}

export interface CommunicationsResponse {
  communications: Communication[];
  summary: string;
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
 * Upload an encrypted UFDR file to the backend for decryption and processing
 */
export async function uploadEncryptedUFDRFile(
  file: File,
  sessionId: string,
  decryptionKey: string,
  hashValue?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);
  formData.append("decryption_key", decryptionKey);
  if (hashValue) {
    formData.append("hash_value", hashValue);
  }

  const response = await fetch(`${API_BASE_URL}/upload-encrypted-ufdr/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to upload encrypted UFDR file");
  }

  return response.json();
}

/**
 * List contents of a UFDR file to see what JSON files are inside
 */
export async function listUFDRContents(
  file: File
): Promise<UFDRContentsResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/list-ufdr-contents/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to list UFDR contents");
  }

  return response.json();
}

/**
 * Upload a single JSON file to the backend for processing
 */
export async function uploadSingleJsonFile(
  file: File,
  sessionId: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);

  const response = await fetch(`${API_BASE_URL}/upload-single-json/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to upload JSON file");
  }

  return response.json();
}

/**
 * Upload multiple JSON files to the backend for processing
 */
export async function uploadMultipleJsonFiles(
  files: File[],
  sessionId: string
): Promise<MultipleUploadResponse> {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  
  files.forEach(file => {
    formData.append("files", file);
  });

  const response = await fetch(`${API_BASE_URL}/upload-multiple/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to upload multiple JSON files");
  }

  return response.json();
}

/**
 * Analyze relationships between people in the UFDR data
 */
export async function analyzeRelationships(
  sessionId: string
): Promise<RelationshipResponse> {
  const formData = new FormData();
  formData.append("session_id", sessionId);

  const response = await fetch(`${API_BASE_URL}/analyze-relationships/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to analyze relationships");
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

export async function getRelationshipCommunications(
  sessionId: string,
  person1Id: string,
  person2Id: string
): Promise<CommunicationsResponse> {
  try {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('person1_id', person1Id);
    formData.append('person2_id', person2Id);

    const response = await fetch(`${API_BASE_URL}/get-relationship-communications/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || 'Failed to get relationship communications');
    }

    return response.json();
  } catch (error) {
    console.error('Error getting relationship communications:', error);
    throw error;
  }
}
