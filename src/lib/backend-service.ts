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

// ===== AUTHENTICATION ENDPOINTS =====

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface AuthResponse {
  message: string;
  user: UserResponse;
}

/**
 * Register a new user
 */
export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const formData = new FormData();
  formData.append('username', data.username);
  formData.append('email', data.email);
  formData.append('password', data.password);
  formData.append('full_name', data.full_name);

  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || 'Failed to sign up');
  }

  return response.json();
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const formData = new FormData();
  formData.append('email', data.email);
  formData.append('password', data.password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || 'Failed to login');
  }

  return response.json();
}

// ===== CASE MANAGEMENT ENDPOINTS =====

export interface Case {
  case_id: string;
  case_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface CaseResponse {
  message: string;
  case: Case;
}

export interface CasesListResponse {
  cases: Case[];
  count: number;
}

/**
 * Create a new case
 */
export async function createCase(
  title: string,
  caseNumber: string,
  description?: string,
  priority: string = 'medium',
  createdBy: string = 'default_user'
): Promise<CaseResponse> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('case_number', caseNumber);
  if (description) formData.append('description', description);
  formData.append('priority', priority);
  formData.append('created_by', createdBy);

  const response = await fetch(`${API_BASE_URL}/cases/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || 'Failed to create case');
  }

  return response.json();
}

/**
 * Get all cases
 */
export async function getCases(status?: string, limit: number = 50): Promise<CasesListResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/cases/?${params.toString()}`);

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || 'Failed to get cases');
  }

  return response.json();
}

/**
 * Get case details
 */
export async function getCaseDetails(caseId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || 'Failed to get case details');
  }

  return response.json();
}

/**
 * Create a session for a case
 */
export async function createSession(
  sessionId: string,
  caseId: string,
  userId: string = 'default_user'
): Promise<any> {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('case_id', caseId);
  formData.append('user_id', userId);

  const response = await fetch(`${API_BASE_URL}/sessions/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || 'Failed to create session');
  }

  return response.json();
}

/**
 * Upload a UFDR file with case_id for MongoDB storage
 */
export async function uploadUFDRFileWithCase(
  file: File,
  sessionId: string,
  caseId: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);
  formData.append("case_id", caseId);

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
 * Analyze relationships with case_id for MongoDB storage
 */
export async function analyzeRelationshipsWithCase(
  sessionId: string,
  caseId: string
): Promise<RelationshipResponse> {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("case_id", caseId);

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

// ===== FORENSIC DATA ENDPOINTS =====

import {
  MessengerData,
  CallLogsData,
  FindMyData,
  ForensicSummary,
  ForensicParseResult,
} from "@/types/forensic";

/**
 * Parse all forensic data from a session (Messenger, call logs, Find My)
 */
export async function parseForensicData(
  sessionId: string,
  caseId: string
): Promise<ForensicParseResult> {
  const formData = new FormData();
  formData.append("case_id", caseId);

  const response = await fetch(`${API_BASE_URL}/forensic/parse-all/${sessionId}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to parse forensic data");
  }

  return response.json();
}

/**
 * Get Messenger data (messages, calls, accounts) for a session
 */
export async function getMessengerData(
  sessionId: string,
  appName?: string
): Promise<MessengerData> {
  const params = new URLSearchParams();
  if (appName) params.append("app_name", appName);

  const response = await fetch(
    `${API_BASE_URL}/forensic/messenger/${sessionId}?${params.toString()}`
  );

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to get messenger data");
  }

  return response.json();
}

/**
 * Get call logs for a session
 */
export async function getCallLogs(sessionId: string): Promise<CallLogsData> {
  const response = await fetch(`${API_BASE_URL}/forensic/call-logs/${sessionId}`);

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to get call logs");
  }

  return response.json();
}

/**
 * Get Find My location data for a session
 */
export async function getFindMyData(sessionId: string): Promise<FindMyData> {
  const response = await fetch(`${API_BASE_URL}/forensic/find-my/${sessionId}`);

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to get Find My data");
  }

  return response.json();
}

/**
 * Get forensic summary statistics for a session
 */
export async function getForensicSummary(sessionId: string): Promise<ForensicSummary | null> {
  const response = await fetch(`${API_BASE_URL}/forensic/summary/${sessionId}`);

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to get forensic summary");
  }

  return response.json();
}

/**
 * Get all forensic data for a case
 */
export async function getCaseForensicData(
  caseId: string,
  dataType?: "messenger" | "call_logs" | "find_my"
): Promise<any> {
  const params = new URLSearchParams();
  if (dataType) params.append("data_type", dataType);

  const response = await fetch(
    `${API_BASE_URL}/forensic/case/${caseId}?${params.toString()}`
  );

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.detail || "Failed to get case forensic data");
  }

  return response.json();
}
