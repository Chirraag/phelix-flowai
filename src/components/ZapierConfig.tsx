import React, { useState } from 'react';
import { Settings, Save, ExternalLink } from 'lucide-react';

interface ZapierConfigProps {
  onWebhookUrlChange: (url: string) => void;
}

export const ZapierConfig: React.FC<ZapierConfigProps> = ({ onWebhookUrlChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span className="font-medium">FlowAI Integration Info</span>
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">FlowAI Integration</h4>
            <p className="text-blue-700 text-sm mb-2">
              Data is automatically sent to FlowAI's processing endpoint after document analysis.
            </p>
            <div className="text-xs text-blue-600 font-mono bg-blue-100 p-2 rounded">
              https://api.myflowai.com/api/v1/sheet/trigger-zap
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Data Fields Sent to FlowAI:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>• Document Name (Original File)</div>
              <div>• Document Type & Confidence</div>
              <div>• Document Number & Pages Range</div>
              <div>• Patient Number & Timestamp</div>
              <div>• Patient Name & Confidence</div>
              <div>• Phone Number & Confidence</div>
              <div>• Address Fields & Confidence</div>
              <div>• Date of Birth & Confidence</div>
              <div>• Gender & Confidence</div>
              <div>• Insurance Info & Confidence</div>
              <div>• Diagnosis & Confidence</div>
              <div>• Timestamp (Processing Time)</div>
              <div>• Patient Number (Within Document)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};