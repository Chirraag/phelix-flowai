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
}