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
  const ZAPIER_WEBHOOK_URL = localStorage.getItem('zapier_webhook_url') || '';
  
  if (!ZAPIER_WEBHOOK_URL) {
    return { success: false, error: 'Zapier webhook URL not configured' };
  }
  
  try {
    // Extract data from the API response
    const result = apiResponse.result;
    
    // Build the payload with confidence scores
    const payload: ZapierPayload = {
      // Document Classification
      type: result.document_type?.overall?.class || '',
      type_confidence: parseFloat(result.document_type?.overall?.confidence || '0'),
      
      // Document Metadata
      document_name: result.document_name_tags?.other?.document_name || '',
      
      // Patient Information
      first_name: result.patient_information?.name?.output?.processed?.first || '',
      first_name_confidence: result.patient_information?.name?.confidence || 0,
      last_name: result.patient_information?.name?.output?.processed?.last || '',
      last_name_confidence: result.patient_information?.name?.confidence || 0,
      phone_number: result.patient_information?.phone?.output?.processed?.cell || 
                   result.patient_information?.phone?.output?.processed?.home || 
                   result.patient_information?.phone?.output?.processed?.work || '',
      phone_number_confidence: result.patient_information?.phone?.confidence || 0,
      
      // Address Information
      address: result.patient_information?.address?.output?.processed?.address || '',
      address_confidence: result.patient_information?.address?.confidence || 0,
      city: result.patient_information?.address?.output?.processed?.city || '',
      city_confidence: result.patient_information?.address?.confidence || 0,
      state: result.patient_information?.address?.output?.processed?.['state/province'] || '',
      state_confidence: result.patient_information?.address?.confidence || 0,
      zip_code: result.patient_information?.address?.output?.processed?.['zip/postal'] || '',
      zip_code_confidence: result.patient_information?.address?.confidence || 0,
      country: result.patient_information?.address?.output?.processed?.country || '',
      
      // Additional Patient Data
      date_of_birth: `${result.patient_information?.DOB?.output?.processed?.month || ''}/${result.patient_information?.DOB?.output?.processed?.day || ''}/${result.patient_information?.DOB?.output?.processed?.year || ''}`,
      date_of_birth_confidence: result.patient_information?.DOB?.confidence || 0,
      gender: result.patient_information?.gender?.output?.processed || '',
      gender_confidence: result.patient_information?.gender?.confidence || 0,
      health_card_number: result.patient_information?.health_card_number?.output?.processed?.NO || '',
      health_card_number_confidence: result.patient_information?.health_card_number?.confidence || 0,
      email: result.patient_information?.email?.output?.processed || '',
      email_confidence: result.patient_information?.email?.confidence || 0,
      
      // Insurance Information
      insurance_name: result.insurance_information?.primary?.insurance_name?.output?.processed || '',
      insurance_name_confidence: result.insurance_information?.primary?.insurance_name?.confidence || 0,
      subscriber_id: result.insurance_information?.primary?.subscriber_id?.output?.processed || '',
      subscriber_id_confidence: result.insurance_information?.primary?.subscriber_id?.confidence || 0,
      
      // Provider Information
      physician_name: `${result.from?.physician_name?.output?.processed?.first || ''} ${result.from?.physician_name?.output?.processed?.last || ''}`.trim(),
      physician_name_confidence: result.from?.physician_name?.confidence || 0,
      facility: result.from?.facility?.output?.processed || '',
      facility_confidence: result.from?.facility?.confidence || 0,
      
      // Diagnosis Information
      diagnosis: result.reason_diagnosis_procedure?.diagnosis?.[0]?.output?.processed?.diagnosis || '',
      diagnosis_confidence: result.reason_diagnosis_procedure?.diagnosis?.[0]?.confidence || 0,
      icd_code: result.reason_diagnosis_procedure?.diagnosis?.[0]?.output?.processed?.icd || '',
      icd_code_confidence: result.reason_diagnosis_procedure?.diagnosis?.[0]?.confidence || 0,
    };
    
    // Send to Zapier
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
    
  } catch (error) {
    console.error('Error sending to Zapier:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};