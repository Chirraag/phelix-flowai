interface ZapierPayload {
  // Document Classification
  type: string;
  type_confidence: number;
  
  // Document Metadata
  document_name: string;
  
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

export const sendToZapier = async (apiResponse: any): Promise<{ success: boolean; error?: string }> => {
  const ZAPIER_WEBHOOK_URL = localStorage.getItem('zapier_webhook_url') || 'https://hooks.zapier.com/hooks/catch/24583493/umd3a4g/';
  
  if (!ZAPIER_WEBHOOK_URL) {
    return { success: false, error: 'Zapier webhook URL not configured' };
  }
  
  try {
    // Handle multi-patient response structure
    const result = apiResponse.result;
    
    // Check if this is a multi-patient response
    if (result.patients && Array.isArray(result.patients)) {
      // Send each patient as a separate webhook call
      const results = [];
      
      for (let i = 0; i < result.patients.length; i++) {
        const patient = result.patients[i];
        const payload = buildZapierPayload(patient, result.document_type, result.document_name_tags, i + 1);
        
        const response = await fetch(ZAPIER_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error(`Zapier webhook failed for patient ${i + 1}: ${response.status} ${response.statusText}`);
        }
        
        results.push({ patient: i + 1, success: true });
      }
      
      return { success: true };
    } else {
      // Single patient response (legacy format)
      const payload = buildZapierPayload(result, result.document_type, result.document_name_tags, 1);
      
      const response = await fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
      }
      
      return { success: true };
    }
    
  } catch (error) {
    console.error('Error sending to Zapier:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }