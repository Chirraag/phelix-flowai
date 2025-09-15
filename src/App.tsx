import React, { useState } from 'react';
import { FileText, Zap, User, Clipboard } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ResponseDisplay } from './components/ResponseDisplay';
import { ZapierConfig } from './components/ZapierConfig';
import { UploadState } from './types';

function App() {
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState('');

  const handleWebhookUrlChange = (url: string) => {
    setZapierWebhookUrl(url);
    // Update the webhook URL in the zapier integration utility
    // This would require modifying the utility to accept dynamic URLs
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img 
                src="./public/flowai-logo.png" 
                alt="FlowAI Logo" 
                className="h-10 w-auto"
              />
              
              {/* Option 2: CSS-based logo placeholder */}
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900">
                Document Processor
              </h1>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Powered by FlowAI</span>
            </div>
          </div>
          <p className="mt-2 text-gray-600">
            Upload your documents for intelligent analysis and data extraction
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <section>
            <ZapierConfig onWebhookUrlChange={handleWebhookUrlChange} />
            
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Upload Document for Analysis
              </h2>
              <p className="text-gray-600">
                Support for medical documents, forms, images, and text files
              </p>
            </div>
            
            <FileUpload onUploadStateChange={setUploadState} />
          </section>

          {/* Results Section */}
          {uploadState?.response && (
            <section>
              <ResponseDisplay response={uploadState.response} />
            </section>
          )}

          {/* Features Section */}
          {!uploadState?.response && (
            <section className="mt-12">
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">
                  What Our AI Can Extract
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Document Structure</h4>
                    <p className="text-sm text-gray-600">
                      Identify document types, sections, and organizational patterns
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Entity Recognition</h4>
                    <p className="text-sm text-gray-600">
                      Extract names, dates, locations, and other key entities
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-3">
                      <Clipboard className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Data Structuring</h4>
                    <p className="text-sm text-gray-600">
                      Convert unstructured text into organized, searchable data
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>© 2025 FlowAI Document Processor. Secure document processing with enterprise-grade AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;