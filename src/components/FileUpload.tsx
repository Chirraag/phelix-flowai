import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { UploadState, ApiResponse } from '../types';
import { sendToZapier } from '../utils/zapierIntegration';
import { extractRecordFromAPI, saveToCSV } from '../utils/csvExport';

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/tiff',
  'image/tif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileUploadProps {
  onUploadStateChange: (state: UploadState) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadStateChange }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    success: false,
    error: null,
    response: null,
    zapierSent: false,
    zapierError: null
  });

  const updateUploadState = useCallback((newState: Partial<UploadState>) => {
    const updatedState = { ...uploadState, ...newState };
    setUploadState(updatedState);
    onUploadStateChange(updatedState);
  }, [uploadState, onUploadStateChange]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return 'File type not supported. Please upload PDF, Word, image, or text files.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size too large. Please upload files under 10MB.';
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      updateUploadState({ error, success: false, response: null });
      return;
    }
    
    setSelectedFile(file);
    updateUploadState({ error: null, success: false, response: null, zapierSent: false, zapierError: null });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile) return;

    updateUploadState({ 
      uploading: true, 
      progress: 0, 
      error: null, 
      success: false,
      response: null,
      zapierSent: false,
      zapierError: null
    });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('multi_patient', 'full');
      formData.append('max_pages', '200'); // Set higher limit for max pages

      // Step 1: Upload document and get task_id
      const response = await fetch('https://api.phelix.ai/dev-portal/doc-ai/fax-ai', {
        method: 'POST',
        headers: {
          'x-access-tokens': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwdWJsaWNfaWQiOiI5YjdhMzlhOC0yOTdmLTRmMzktODFhMy1kNjI1OTI0ZWE0ODMiLCJleHAiOjE3ODkyMjA4OTF9.Z8MAaI-CrQ15qz5QSBit8m9cwx_4HbsnZknr9C6Cvyc'
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || !data.is_success) {
        throw new Error(data.message || 'Upload failed');
      }

      const taskId = data.task_id;
      updateUploadState({ progress: 25 });

      // Step 2: Poll for results
      const pollForResults = async (): Promise<any> => {
        const maxAttempts = 540; // 45 minutes with 5-second intervals
        let attempts = 0;

        while (attempts < maxAttempts) {
          try {
            const pollResponse = await fetch(`https://api.phelix.ai/dev-portal/doc-ai/response?task_id=${taskId}`, {
              method: 'GET',
              headers: {
                'x-access-tokens': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwdWJsaWNfaWQiOiI5YjdhMzlhOC0yOTdmLTRmMzktODFhMy1kNjI1OTI0ZWE0ODMiLCJleHAiOjE3ODkyMjA4OTF9.Z8MAaI-CrQ15qz5QSBit8m9cwx_4HbsnZknr9C6Cvyc'
              }
            });

            const pollData = await pollResponse.json();
            
            // Update progress based on polling attempts
            const progress = Math.min(25 + (attempts / maxAttempts) * 70, 90);
            updateUploadState({ progress });

            // Show more detailed status updates
            if (attempts % 12 === 0 && attempts > 0) { // Every minute
              console.log(`Still processing... ${Math.round(progress)}% complete`);
            }

            if (pollData.status === 'success') {
              return pollData;
            } else if (pollData.status === 'failed' || pollData.status === 'error') {
              throw new Error(pollData.message || 'Processing failed');
            } else if (pollData.status === 'processing' || pollData.status === 'pending') {
              // Continue polling - document is still being processed
              console.log(`Processing... Attempt ${attempts + 1}/${maxAttempts}`);
            }
            
            // Wait 5 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
            
          } catch (error) {
            if (attempts === maxAttempts - 1) {
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
          }
        }
        
        throw new Error('Processing timeout after 45 minutes. Very large documents may take longer to process. Please try again or contact support if the issue persists.');
      };

      const finalResult = await pollForResults();
      updateUploadState({ progress: 100 });

      setTimeout(() => {
        updateUploadState({
          uploading: false,
          success: true,
          response: { success: true, data: finalResult }
        });

        // Send to Zapier after successful processing
        sendDataToZapier(finalResult);
      }, 500);

    } catch (error) {
      updateUploadState({
        uploading: false,
        error: error instanceof Error ? error.message : 'Processing error occurred',
        response: { success: false, error: error instanceof Error ? error.message : 'Processing error occurred' }
      });
    }
  };

  const sendDataToZapier = async (apiResponse: any) => {
    try {
      console.log('sendDataToZapier received:', apiResponse);
      console.log('API Response structure check:', {
        hasMultiPatient: !!apiResponse?.multi_patient,
        hasResult: !!apiResponse?.result,
        hasDocument1: !!apiResponse?.['Document-1'],
        hasDocument2: !!apiResponse?.['Document-2'],
        topLevelKeys: apiResponse ? Object.keys(apiResponse) : []
      });

      const csvRecords = extractRecordFromAPI(apiResponse, selectedFile?.name);
      const patientCount = csvRecords.length;

      console.log(`Extracted ${patientCount} records:`, csvRecords);

      await saveToCSV(csvRecords);
      console.log('Records saved to CSV successfully');

      const zapierResult = await sendToZapier(apiResponse, selectedFile?.name);

      if (zapierResult.success) {
        updateUploadState({ zapierSent: true, zapierError: null, patientCount });
      } else {
        updateUploadState({ zapierSent: false, zapierError: zapierResult.error || 'Failed to send to Zapier', patientCount });
      }
    } catch (error) {
      console.error('Error in sendDataToZapier:', error);
      updateUploadState({
        zapierSent: false,
        zapierError: error instanceof Error ? error.message : 'Failed to send to Zapier'
      });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    onUploadStateChange({
      uploading: false,
      progress: 0,
      success: false,
      error: null,
      response: null,
      zapierSent: false,
      zapierError: null
    });
    setUploadState({
      uploading: false,
      progress: 0,
      success: false,
      error: null,
      response: null,
      zapierSent: false,
      zapierError: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getUploadZoneClasses = () => {
    // Don't allow new uploads while processing or showing results
    if (uploadState.uploading || uploadState.success || uploadState.response) {
      return "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-not-allowed opacity-60";
    }
    
    let baseClasses = "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer";
    
    if (uploadState.error) {
      return `${baseClasses} border-red-300 bg-red-50`;
    }
    
    if (isDragOver) {
      return `${baseClasses} border-blue-400 bg-blue-50`;
    }
    
    if (selectedFile) {
      return `${baseClasses} border-blue-300 bg-blue-50`;
    }
    
    return `${baseClasses} border-gray-300 hover:border-blue-400 hover:bg-blue-50`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={getUploadZoneClasses()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          // Prevent new uploads while processing or showing results
          if (!uploadState.uploading && !uploadState.success && !uploadState.response) {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.tiff,.tif"
          onChange={handleInputChange}
          className="hidden"
        />
        
        {/* Upload Progress Overlay */}
        {uploadState.uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-blue-700 font-medium">Processing Document...</p>
              <div className="w-48 bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {uploadState.success && (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Document Processed Successfully!</h3>
            <p className="text-green-600">{selectedFile?.name}</p>
            {uploadState.patientCount && uploadState.patientCount > 1 && (
              <p className="text-sm text-blue-600 font-medium mt-1">
                Multi-patient document: {uploadState.patientCount} patients detected
              </p>
            )}
            <p className="text-sm text-gray-600 mt-2">View the extracted data below</p>

            {/* Zapier Status */}
            <div className="mt-4 p-3 rounded-lg bg-blue-50">
              {uploadState.zapierSent ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {uploadState.patientCount && uploadState.patientCount > 1
                        ? `${uploadState.patientCount} patient records saved to CSV successfully`
                        : 'Data saved to CSV successfully'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Data sent to FlowAI successfully</span>
                  </div>
                </div>
              ) : uploadState.zapierError ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {uploadState.patientCount && uploadState.patientCount > 1
                        ? `${uploadState.patientCount} patient records saved to CSV successfully`
                        : 'Data saved to CSV successfully'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-orange-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">FlowAI API is currently unavailable</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Saving data...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {uploadState.error && (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Upload Failed</h3>
            <p className="text-red-600 mb-4">{uploadState.error}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* File Selected State */}
        {selectedFile && !uploadState.uploading && !uploadState.success && !uploadState.error && !uploadState.response && (
          <div className="text-center">
            <File className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">File Ready to Upload</h3>
            <p className="text-gray-600 mb-4">{selectedFile.name}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  uploadDocument();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Process Document
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetUpload();
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Default Upload State */}
        {!selectedFile && !uploadState.uploading && !uploadState.success && !uploadState.error && !uploadState.response && (
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Your Document</h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, Word, images, and text files (max 10MB)
            </p>
          </div>
        )}
      </div>
      
      {/* Reset Button - Only show when there's a response */}
      {uploadState.response && (
        <div className="text-center mt-4">
          <button
            onClick={resetUpload}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Upload Another Document
          </button>
        </div>
      )}
    </div>
  );
};