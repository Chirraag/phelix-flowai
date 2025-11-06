import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface PatientRecord {
  patient_number: number;
  patient_name?: string;
  date_of_birth?: string;
  medical_record_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  insurance_provider?: string;
  insurance_id?: string;
  diagnoses?: string[];
  medications?: string[];
  allergies?: string[];
  procedures?: string[];
  visit_date?: string;
  provider_name?: string;
  notes?: string;
  [key: string]: any;
}

export interface OpenAIExtractionResult {
  document_type?: string;
  total_pages?: number;
  patients: PatientRecord[];
  metadata?: {
    processing_time?: number;
    model_used?: string;
  };
}

export async function extractDataWithOpenAI(
  file: File
): Promise<OpenAIExtractionResult> {
  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'pdf') {
      return await extractFromPDF(file);
    } else if (['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(fileExtension || '')) {
      return await extractFromImage(file);
    } else {
      throw new Error('Unsupported file type. Please upload PDF or image files.');
    }
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw error;
  }
}

async function extractFromPDF(file: File): Promise<OpenAIExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  const totalPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt()
        },
        {
          role: 'user',
          content: `Extract all patient information from this medical document. The document has ${totalPages} pages. If there are multiple patients, extract information for each one separately. Make sure to return ONLY a valid JSON object with the exact structure specified in the system prompt.\n\nDocument content:\n${fullText}`
        }
      ],
      max_tokens: 4096,
      temperature: 0.1,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return parseOpenAIResponse(data);
}

async function extractFromImage(file: File): Promise<OpenAIExtractionResult> {
  const base64File = await fileToBase64(file);
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
  const imageUrl = `data:${mimeType};base64,${base64File}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt()
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all patient information from this medical document. If there are multiple patients, extract information for each one separately.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return parseOpenAIResponse(data);
}

function getSystemPrompt(): string {
  return `You are a medical document extraction AI. Extract patient information from documents with high accuracy.

IMPORTANT: Documents may contain information for MULTIPLE PATIENTS. You MUST:
1. Identify ALL patients in the document
2. Extract complete information for EACH patient separately
3. Return an array of patient records, one for each unique patient found
4. Assign each patient a patient_number (1, 2, 3, etc.)

For each patient, extract:
- Patient demographics (name, DOB, MRN, contact info)
- Insurance information
- Diagnoses and conditions
- Medications and prescriptions
- Allergies
- Procedures and treatments
- Visit information
- Provider details
- Any other relevant medical data

Return ONLY valid JSON in this exact format:
{
  "document_type": "string describing the document type",
  "total_pages": number,
  "patients": [
    {
      "patient_number": 1,
      "patient_name": "string",
      "date_of_birth": "YYYY-MM-DD",
      "medical_record_number": "string",
      "address": "string",
      "phone": "string",
      "email": "string",
      "insurance_provider": "string",
      "insurance_id": "string",
      "diagnoses": ["array of diagnoses"],
      "medications": ["array of medications"],
      "allergies": ["array of allergies"],
      "procedures": ["array of procedures"],
      "visit_date": "YYYY-MM-DD",
      "provider_name": "string",
      "notes": "any additional relevant information"
    }
  ]
}

If a field is not found, omit it or use null. Extract ALL patients found in the document.`;
}

function parseOpenAIResponse(data: any): OpenAIExtractionResult {
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from OpenAI response');
  }

  const extractedData: OpenAIExtractionResult = JSON.parse(jsonMatch[0]);

  if (!extractedData.patients || !Array.isArray(extractedData.patients)) {
    extractedData.patients = [extractedData as any];
  }

  extractedData.patients = extractedData.patients.map((patient, index) => ({
    ...patient,
    patient_number: patient.patient_number || index + 1,
  }));

  return extractedData;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
