import React, { useState } from 'react';
import { Settings, Save, ExternalLink } from 'lucide-react';

interface ZapierConfigProps {
  onWebhookUrlChange: (url: string) => void;
}

export const ZapierConfig: React.FC<ZapierConfigProps> = ({ onWebhookUrlChange }) => {
  const [webhookUrl, setWebhookUrl] = useState(
    localStorage.getItem('zapier_webhook_url') || 'https://hooks.zapier.com/hooks/catch/24583493/umd3a4g/'
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = () => {
    localStorage.setItem('zapier_webhook_url', webhookUrl);
    onWebhookUrlChange(webhookUrl);
    setIsExpanded(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span className="font-medium">Zapier Integration Settings</span>
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 mb-2">
              Zapier Webhook URL
            </label>
            <input
              id="webhook-url"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your webhook URL from your Zapier trigger setup
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
            
            <a
              href="https://zapier.com/apps/webhook/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Setup Zapier Webhook
            </a>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Data Fields Sent to Zapier:</h4>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};