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
