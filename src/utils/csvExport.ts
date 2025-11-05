interface CSVRecord {
  timestamp: string;
  document_name_upload: string;
  patient_number: number;
  type: string;
  type_confidence: number;
  first_name: string;
  first_name_confidence: number;
  last_name: string;
  last_name_confidence: number;
  phone_number: string;
  phone_number_confidence: number;
  address: string;
  address_confidence: number;
  city: string;
  city_confidence: number;
  state: string;
  state_confidence: number;
  zip_code: string;
  zip_code_confidence: number;
  country: string;
  date_of_birth: string;
  date_of_birth_confidence: number;
  gender: string;
  gender_confidence: number;
  health_card_number: string;
  health_card_number_confidence: number;
  email: string;
  email_confidence: number;
  insurance_name: string;
  insurance_name_confidence: number;
  subscriber_id: string;
  subscriber_id_confidence: number;
  physician_name: string;
  physician_name_confidence: number;
  facility: string;
  facility_confidence: number;
  diagnosis: string;
  diagnosis_confidence: number;
  icd_code: string;
  icd_code_confidence: number;
}

const CSV_HEADERS = [
  'timestamp',
  'document_name_upload',
  'patient_number',
  'type',
  'type_confidence',
  'first_name',
  'first_name_confidence',
  'last_name',
  'last_name_confidence',
  'phone_number',
  'phone_number_confidence',
  'address',
  'address_confidence',
  'city',
  'city_confidence',
  'state',
  'state_confidence',
  'zip_code',
  'zip_code_confidence',
  'country',
  'date_of_birth',
  'date_of_birth_confidence',
  'gender',
  'gender_confidence',
  'health_card_number',
  'health_card_number_confidence',
  'email',
  'email_confidence',
  'insurance_name',
  'insurance_name_confidence',
  'subscriber_id',
  'subscriber_id_confidence',
  'physician_name',
  'physician_name_confidence',
  'facility',
  'facility_confidence',
  'diagnosis',
  'diagnosis_confidence',
  'icd_code',
  'icd_code_confidence'
];

const extractSinglePatientRecord = (result: any, fileName: string, timestamp: string, patientNumber: number): CSVRecord => {
  const firstDiagnosis = result.reason_diagnosis_procedure?.diagnosis?.[0];

  return {
    timestamp,
    document_name_upload: fileName,
    patient_number: patientNumber,
    type: result.document_type?.overall?.class || '',
    type_confidence: parseFloat(result.document_type?.overall?.confidence || '0'),
    first_name: result.patient_information?.name?.output?.processed?.first || '',
    first_name_confidence: result.patient_information?.name?.confidence || 0,
    last_name: result.patient_information?.name?.output?.processed?.last || '',
    last_name_confidence: result.patient_information?.name?.confidence || 0,
    phone_number: result.patient_information?.phone?.output?.processed?.cell ||
                 result.patient_information?.phone?.output?.processed?.home ||
                 result.patient_information?.phone?.output?.processed?.work || '',
    phone_number_confidence: result.patient_information?.phone?.confidence || 0,
    address: result.patient_information?.address?.output?.processed?.address || '',
    address_confidence: result.patient_information?.address?.confidence || 0,
    city: result.patient_information?.address?.output?.processed?.city || '',
    city_confidence: result.patient_information?.address?.confidence || 0,
    state: result.patient_information?.address?.output?.processed?.['state/province'] || '',
    state_confidence: result.patient_information?.address?.confidence || 0,
    zip_code: result.patient_information?.address?.output?.processed?.['zip/postal'] || '',
    zip_code_confidence: result.patient_information?.address?.confidence || 0,
    country: result.patient_information?.address?.output?.processed?.country || '',
    date_of_birth: `${result.patient_information?.DOB?.output?.processed?.month || ''}/${result.patient_information?.DOB?.output?.processed?.day || ''}/${result.patient_information?.DOB?.output?.processed?.year || ''}`,
    date_of_birth_confidence: result.patient_information?.DOB?.confidence || 0,
    gender: result.patient_information?.gender?.output?.processed || '',
    gender_confidence: result.patient_information?.gender?.confidence || 0,
    health_card_number: result.patient_information?.health_card_number?.output?.processed?.NO || '',
    health_card_number_confidence: result.patient_information?.health_card_number?.confidence || 0,
    email: result.patient_information?.email?.output?.processed || '',
    email_confidence: result.patient_information?.email?.confidence || 0,
    insurance_name: result.insurance_information?.primary?.insurance_name?.output?.processed || '',
    insurance_name_confidence: result.insurance_information?.primary?.insurance_name?.confidence || 0,
    subscriber_id: result.insurance_information?.primary?.subscriber_id?.output?.processed || '',
    subscriber_id_confidence: result.insurance_information?.primary?.subscriber_id?.confidence || 0,
    physician_name: `${result.from?.physician_name?.output?.processed?.first || ''} ${result.from?.physician_name?.output?.processed?.last || ''}`.trim(),
    physician_name_confidence: result.from?.physician_name?.confidence || 0,
    facility: result.from?.facility?.output?.processed || '',
    facility_confidence: result.from?.facility?.confidence || 0,
    diagnosis: firstDiagnosis?.output?.processed?.diagnosis || '',
    diagnosis_confidence: firstDiagnosis?.confidence || 0,
    icd_code: firstDiagnosis?.output?.processed?.icd || firstDiagnosis?.output?.processed?.icd10 || firstDiagnosis?.output?.processed?.icd9 || '',
    icd_code_confidence: firstDiagnosis?.confidence || 0,
  };
};

export const extractRecordFromAPI = (apiResponse: any, originalFileName?: string): CSVRecord[] => {
  const fileName = originalFileName || '';
  const timestamp = new Date().toISOString();
  const records: CSVRecord[] = [];

  console.log('Extracting records from API response:', {
    hasMultiPatient: !!apiResponse?.result?.multi_patient,
    isMultiPatient: apiResponse?.result?.multi_patient?.is_multi_patient,
    hasResult: !!apiResponse?.result,
    hasDocument1: !!apiResponse?.result?.['Document-1'],
    hasDocument2: !!apiResponse?.result?.['Document-2'],
    topLevelKeys: apiResponse ? Object.keys(apiResponse) : [],
    resultKeys: apiResponse?.result ? Object.keys(apiResponse.result) : []
  });

  // Check if this is a multi-patient document
  if (apiResponse?.result?.multi_patient?.is_multi_patient) {
    console.log('Multi-patient document detected');
    let patientNumber = 1;

    // Loop through Document-1, Document-2, etc. in the result object
    for (const key in apiResponse.result) {
      if (key.startsWith('Document-') && apiResponse.result[key]?.result) {
        console.log(`Extracting patient ${patientNumber} from ${key}`);
        records.push(extractSinglePatientRecord(apiResponse.result[key].result, fileName, timestamp, patientNumber));
        patientNumber++;
      }
    }
    console.log(`Total multi-patient records extracted: ${records.length}`);
  } else if (apiResponse?.result && !apiResponse.result.multi_patient) {
    // Single patient document (old format)
    console.log('Extracting single patient document');
    records.push(extractSinglePatientRecord(apiResponse.result, fileName, timestamp, 1));
  }

  return records;
};

const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

export const saveToCSV = async (newRecords: CSVRecord[]): Promise<void> => {
  const CSV_STORAGE_KEY = 'document_processing_records';

  try {
    console.log(`Saving ${newRecords.length} new records to CSV`);

    const existingData = localStorage.getItem(CSV_STORAGE_KEY);
    let records: CSVRecord[] = [];

    if (existingData) {
      records = JSON.parse(existingData);
      console.log(`Found ${records.length} existing records`);
    }

    records.push(...newRecords);
    console.log(`Total records after adding new ones: ${records.length}`);

    localStorage.setItem(CSV_STORAGE_KEY, JSON.stringify(records));
    console.log('Successfully saved to localStorage');

    // Verify the save
    const verifyData = localStorage.getItem(CSV_STORAGE_KEY);
    if (verifyData) {
      const verifyRecords = JSON.parse(verifyData);
      console.log(`Verification: localStorage now contains ${verifyRecords.length} records`);
    }
  } catch (error) {
    console.error('Error saving to local storage:', error);
    throw error;
  }
};

export const downloadAllRecordsAsCSV = (): void => {
  const CSV_STORAGE_KEY = 'document_processing_records';

  try {
    const existingData = localStorage.getItem(CSV_STORAGE_KEY);

    if (!existingData) {
      alert('No records found to download');
      return;
    }

    const records: CSVRecord[] = JSON.parse(existingData);

    if (records.length === 0) {
      alert('No records found to download');
      return;
    }

    const csvHeader = CSV_HEADERS.join(',') + '\n';

    const csvRows = records.map(record => {
      return CSV_HEADERS.map(header => {
        const value = record[header as keyof CSVRecord];
        return escapeCSVValue(value);
      }).join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `document_records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error('Error downloading CSV:', error);
    alert('Error downloading CSV file');
  }
};

export const getRecordCount = (): number => {
  const CSV_STORAGE_KEY = 'document_processing_records';

  try {
    const existingData = localStorage.getItem(CSV_STORAGE_KEY);

    if (!existingData) {
      console.log('No records found in localStorage');
      return 0;
    }

    const records: CSVRecord[] = JSON.parse(existingData);
    console.log(`Record count: ${records.length}`);
    return records.length;
  } catch (error) {
    console.error('Error getting record count:', error);
    return 0;
  }
};

export const clearAllRecords = (): void => {
  const CSV_STORAGE_KEY = 'document_processing_records';
  localStorage.removeItem(CSV_STORAGE_KEY);
};
