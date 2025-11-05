export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface UploadState {
  uploading: boolean;
  progress: number;
  success: boolean;
  error: string | null;
  response: ApiResponse | null;
  zapierSent: boolean;
  zapierError: string | null;
  patientCount?: number;
}

export interface ZapierPayload {
  // Document Classification
  type: string;
  type_confidence: number;
  
  // Document Metadata
  document_name_upload: string; // Original uploaded file name
  document_number: number; // Which document in the multi-document response (1, 2, 3, etc.)
  pages_range: string; // e.g., "Page 1-21"
  patient_number: number; // Patient number within the document (1, 2, 3, etc.)
  timestamp: string; // ISO timestamp when processed
}