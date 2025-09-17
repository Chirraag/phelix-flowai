interface ZapierPayload {
  // Document Classification
  type: string;
  type_confidence: number;
  
  // Document Metadata
  document_name: string; // Original uploaded file name
  document_name: string;
  document_number: number; // Which document in the multi-document response (1, 2, 3, etc.)
  pages_range: string; // e.g., "Page 1-21"
  patient_number: number; // Patient number within the document (1, 2, 3, etc.)
  timestamp: string; // ISO timestamp when processed
  
  // Patient Information
  first_name: string;
  first_name_confidence: number;
  last_name: string;
  last_name_confidence: number;
  phone_number: string;
  phone_number_confidence: number;
  
  // Address Information
  address: string;
  address_confidence: number;
  city: string;
  city_confidence: number;
  state: string;
  state_confidence: number;
  zip_code: string;
  zip_code_confidence: number;
  country: string;
  
  // Additional Patient Data
  date_of_birth: string;
  date_of_birth_confidence: number;
  gender: string;
  gender_confidence: number;
  health_card_number: string;
  health_card_number_confidence: number;
  email: string;
  email_confidence: number;
  
  // Insurance Information
  insurance_name: string;
  insurance_name_confidence: number;
  subscriber_id: string;
  subscriber_id_confidence: number;
  
  // Provider Information
  physician_name: string;
  physician_name_confidence: number;
  facility: string;
  facility_confidence: number;
  
  // Diagnosis Information
  diagnosis: string;
  diagnosis_confidence: number;
  icd_code: string;
  icd_code_confidence: number;
}

export const sendToZapier = async (apiResponse: any, originalFileName: string): Promise<{ success: boolean; error?: string }> => {
  const FLOWAI_API_URL = 'https://api.myflowai.com/api/v1/sheet/trigger-zap';
  
  try {
    const result = apiResponse.result;
    
    // Check if this is a multi-document response
    if (result.multi_patient && result.multi_patient.is_multi_patient) {
      const results = [];
      const multiPatientClusters = result.multi_patient.multi_patient_clusters;
      
      // Process each document
      for (const [documentKey, pagesRange] of Object.entries(multiPatientClusters)) {
        const documentData = result[documentKey];
        if (documentData && documentData.result) {
          const documentNumber = parseInt(documentKey.replace('Document-', ''));
          const payload = buildZapierPayload(documentData.result, documentNumber, pagesRange as string);
          
          const response = await fetch(FLOWAI_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          
          if (!response.ok) {
            throw new Error(`Zapier webhook failed for ${documentKey}: ${response.status} ${response.statusText}`);
          }
          
          results.push({ document: documentKey, success: true });
        }
      }
      
      return { success: true };
    } else {
      // Single document response (legacy format)
      const payload = buildZapierPayload(result, 1, 'Page 1');
      
      const response = await fetch(FLOWAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`FlowAI API failed: ${response.status} ${response.statusText}`);
      }
      
      return { success: true };
    }
    
  } catch (error) {
    console.error('Error sending to Zapier:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'FlowAI API error occurred' 
    };
  }
};

// Helper function to build Zapier payload for a single document
const buildZapierPayload = (
  documentData: any, 
  documentNumber: number, 
  pagesRange: string, 
  originalFileName: string,
  timestamp: string,
  patientNumber: number
): ZapierPayload => {
  // Get the first diagnosis if multiple exist
  const firstDiagnosis = documentData.reason_diagnosis_procedure?.diagnosis?.[0];
  
  return {
    // Document Classification
    type: documentData.document_type?.overall?.class || '',
    type_confidence: parseFloat(documentData.document_type?.overall?.confidence || '0'),
    
    // Document Metadata
    document_name: originalFileName,
    document_number: documentNumber,
    pages_range: pagesRange,
    patient_number: patientNumber,
    timestamp: timestamp,
    
    // Patient Information
    first_name: documentData.patient_information?.name?.output?.processed?.first || '',
    first_name_confidence: documentData.patient_information?.name?.confidence || 0,
    last_name: documentData.patient_information?.name?.output?.processed?.last || '',
    last_name_confidence: documentData.patient_information?.name?.confidence || 0,
    phone_number: documentData.patient_information?.phone?.output?.processed?.cell || 
                 documentData.patient_information?.phone?.output?.processed?.home || 
                 documentData.patient_information?.phone?.output?.processed?.work || '',
    phone_number_confidence: documentData.patient_information?.phone?.confidence || 0,
    
    // Address Information
    address: documentData.patient_information?.address?.output?.processed?.address || '',
    address_confidence: documentData.patient_information?.address?.confidence || 0,
    city: documentData.patient_information?.address?.output?.processed?.city || '',
    city_confidence: documentData.patient_information?.address?.confidence || 0,
    state: documentData.patient_information?.address?.output?.processed?.['state/province'] || '',
    state_confidence: documentData.patient_information?.address?.confidence || 0,
    zip_code: documentData.patient_information?.address?.output?.processed?.['zip/postal'] || '',
    zip_code_confidence: documentData.patient_information?.address?.confidence || 0,
    country: documentData.patient_information?.address?.output?.processed?.country || '',
    
    // Additional Patient Data
    date_of_birth: `${documentData.patient_information?.DOB?.output?.processed?.month || ''}/${documentData.patient_information?.DOB?.output?.processed?.day || ''}/${documentData.patient_information?.DOB?.output?.processed?.year || ''}`,
    date_of_birth_confidence: documentData.patient_information?.DOB?.confidence || 0,
    gender: documentData.patient_information?.gender?.output?.processed || '',
    gender_confidence: documentData.patient_information?.gender?.confidence || 0,
    health_card_number: documentData.patient_information?.health_card_number?.output?.processed?.NO || '',
    health_card_number_confidence: documentData.patient_information?.health_card_number?.confidence || 0,
    email: documentData.patient_information?.email?.output?.processed || '',
    email_confidence: documentData.patient_information?.email?.confidence || 0,
    
    // Insurance Information
    insurance_name: documentData.insurance_information?.primary?.insurance_name?.output?.processed || '',
    insurance_name_confidence: documentData.insurance_information?.primary?.insurance_name?.confidence || 0,
    subscriber_id: documentData.insurance_information?.primary?.subscriber_id?.output?.processed || '',
    subscriber_id_confidence: documentData.insurance_information?.primary?.subscriber_id?.confidence || 0,
    
    // Provider Information
    physician_name: `${documentData.from?.physician_name?.output?.processed?.first || ''} ${documentData.from?.physician_name?.output?.processed?.last || ''}`.trim(),
    physician_name_confidence: documentData.from?.physician_name?.confidence || 0,
    facility: documentData.from?.facility?.output?.processed || '',
    facility_confidence: documentData.from?.facility?.confidence || 0,
    
    // Diagnosis Information
    diagnosis: firstDiagnosis?.output?.processed?.diagnosis || '',
    diagnosis_confidence: firstDiagnosis?.confidence || 0,
    icd_code: firstDiagnosis?.output?.processed?.icd || '',
    icd_code_confidence: firstDiagnosis?.confidence || 0,
  };
};