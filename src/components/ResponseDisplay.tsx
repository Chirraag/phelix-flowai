import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, User, Calendar, Clipboard } from 'lucide-react';
import { ApiResponse } from '../types';

interface ResponseDisplayProps {
  response: ApiResponse;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleDocument = (documentKey: string) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(documentKey)) {
      newExpanded.delete(documentKey);
    } else {
      newExpanded.add(documentKey);
    }
    setExpandedDocuments(newExpanded);
  };

  if (!response.success) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-xl">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Processing Error</h3>
        <p className="text-red-600">{response.error}</p>
      </div>
    );
  }

  const renderValue = (value: any, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className={`font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600 font-medium">{value}</span>;
    }

    if (typeof value === 'string') {
      if (value.length > 100) {
        const [isExpanded, setIsExpanded] = useState(false);
        return (
          <div>
            <span className="text-gray-800">
              {isExpanded ? value : `${value.substring(0, 100)}...`}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
          </div>
        );
      }
      return <span className="text-gray-800">{value}</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="pl-4 border-l-2 border-gray-200">
              <span className="text-sm text-gray-500 font-medium">Item {index + 1}:</span>
              <div className="mt-1">
                {renderValue(item, depth + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      return (
        <div className="space-y-3">
          {entries.map(([key, val], index) => (
            <div key={index} className={`${depth > 0 ? 'pl-4 border-l-2 border-gray-100' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
              </div>
              <div className="mt-1 pl-4">
                {renderValue(val, depth + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-gray-600">{String(value)}</span>;
  };

  const getSectionIcon = (key: string) => {
    if (key.toLowerCase().includes('patient') || key.toLowerCase().includes('person')) {
      return <User className="w-4 h-4" />;
    }
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      return <Calendar className="w-4 h-4" />;
    }
    if (key.toLowerCase().includes('document') || key.toLowerCase().includes('file')) {
      return <FileText className="w-4 h-4" />;
    }
    return <Clipboard className="w-4 h-4" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Document Analysis Results
      </h3>
      
      {/* Check if this is a multi-document response */}
      {response.data?.result?.multi_patient?.is_multi_patient ? (
        <div className="space-y-6">
          {/* Multi-patient summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Multi-Document Analysis</h4>
            <p className="text-blue-700 text-sm mb-3">
              Found {Object.keys(response.data.result.multi_patient.multi_patient_clusters).length} documents
              (Confidence: {(response.data.result.multi_patient.confidence * 100).toFixed(1)}%)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {Object.entries(response.data.result.multi_patient.multi_patient_clusters).map(([doc, pages]) => (
                <div key={doc} className="bg-white rounded px-2 py-1">
                  <span className="font-medium text-blue-800">{doc}:</span> {pages}
                </div>
              ))}
            </div>
          </div>

          {/* Single document display - new structure doesn't separate by document in response */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">
                    {response.data.result.document_type?.overall?.class || 'Unknown Document'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Patient: {response.data.result.patient_information?.name?.output?.processed?.first} {response.data.result.patient_information?.name?.output?.processed?.last}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200">
              <div className="p-4 space-y-4">
                {Object.entries(response.data.result).filter(([key]) => key !== 'multi_patient').map(([key, value], index) => {
                  const sectionId = `section-${index}`;
                  const isExpanded = expandedSections.has(sectionId);

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(sectionId)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {getSectionIcon(key)}
                          <span className="font-medium text-gray-800 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-4 border-t border-gray-200 bg-white">
                          {renderValue(value)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Single document response (new format without multi_patient)
        <div className="space-y-4">
          {response.data?.result && typeof response.data.result === 'object' ? (
            Object.entries(response.data.result).map(([key, value], index) => {
              const sectionId = `section-${index}`;
              const isExpanded = expandedSections.has(sectionId);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {getSectionIcon(key)}
                      <span className="font-medium text-gray-800 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200 bg-white">
                      {renderValue(value)}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};