# FlowAI Document Processor

A document processing application that extracts structured data from medical documents using FlowAI's API.

## Features

- Upload and process PDF, Word, images, and text files
- Extract patient information, insurance details, diagnosis, and provider information
- Automatic CSV export of all extracted data
- Download processed records as CSV file
- Local storage of records in browser

## CSV Export

Every processed document is automatically saved to a CSV file with the following fields:

- timestamp
- document_name_upload
- patient_number
- type & type_confidence
- first_name & first_name_confidence
- last_name & last_name_confidence
- phone_number & phone_number_confidence
- address, city, state, zip_code, country & confidence scores
- date_of_birth & date_of_birth_confidence
- gender & gender_confidence
- health_card_number & health_card_number_confidence
- email & email_confidence
- insurance_name & insurance_name_confidence
- subscriber_id & subscriber_id_confidence
- physician_name & physician_name_confidence
- facility & facility_confidence
- diagnosis & diagnosis_confidence
- icd_code & icd_code_confidence

Records are stored locally in your browser's localStorage and can be downloaded as a CSV file at any time.

## Usage

1. Upload a document using the drag-and-drop interface or file picker
2. Wait for the document to be processed
3. View extracted data in the interface
4. Data is automatically saved to CSV
5. Click "Download CSV" to export all records
6. Use "Clear All" to remove all saved records

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
