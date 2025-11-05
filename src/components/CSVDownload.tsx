import React, { useState, useEffect } from 'react';
import { Download, Database, Trash2 } from 'lucide-react';
import { downloadAllRecordsAsCSV, getRecordCount, clearAllRecords } from '../utils/csvExport';

export const CSVDownload: React.FC = () => {
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setRecordCount(getRecordCount());
    };

    updateCount();

    const interval = setInterval(updateCount, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    downloadAllRecordsAsCSV();
  };

  const handleClear = () => {
    if (confirm(`Are you sure you want to delete all ${recordCount} records? This action cannot be undone.`)) {
      clearAllRecords();
      setRecordCount(0);
    }
  };

  if (recordCount === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Database className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Saved Records</h3>
            <p className="text-sm text-gray-600">
              {recordCount} document{recordCount !== 1 ? 's' : ''} processed and saved
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Records are stored locally in your browser. Download the CSV file to back up your data.
        </p>
      </div>
    </div>
  );
};
