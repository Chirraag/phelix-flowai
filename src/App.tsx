import React, { useState } from 'react';
import { FileText, Zap, User, Clipboard, Rocket, Monitor, Calendar, ClipboardList, Phone, BarChart3, Users, ChevronDown, ChevronRight, FileCheck } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ResponseDisplay } from './components/ResponseDisplay';
import { ZapierConfig } from './components/ZapierConfig';
import { CSVDownload } from './components/CSVDownload';
import { UploadState } from './types';

function App() {
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [isAIAgentsOpen, setIsAIAgentsOpen] = useState(true);
  const [currentView, setCurrentView] = useState('fax-ai');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <img
            src="https://dev.myflowai.com/logo_flowai.png"
            alt="Flow AI Logo"
            className="h-10 w-auto"
          />
        </div>

        {/* User Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
              FA
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">Flow AI</div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {/* Launchpad */}
            <button
              onClick={() => setCurrentView('launchpad')}
              className="w-full flex items-center gap-3 px-3 py-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Rocket className="w-5 h-5" />
              <span className="text-sm font-medium">Launchpad</span>
            </button>

            {/* AI Agents Dropdown */}
            <div>
              <button
                onClick={() => setIsAIAgentsOpen(!isAIAgentsOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Monitor className="w-5 h-5" />
                <span className="text-sm font-medium flex-1 text-left">AI Agents</span>
                {isAIAgentsOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {isAIAgentsOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  <button
                    onClick={() => setCurrentView('fax-ai')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span className="text-sm">Fax AI</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Scheduling Agent</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                    <ClipboardList className="w-4 h-4" />
                    <span className="text-sm">Patient Intake Agent</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Customer Support Agent</span>
                  </button>
                </div>
              )}
            </div>

            {/* Analytics */}
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-medium">Analytics</span>
            </button>

            {/* Members */}
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Members</span>
            </button>
          </div>
        </nav>

        {/* User Info at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
              CH
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">chirag.gupta</div>
              <div className="text-xs text-gray-500">Super-Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Launchpad</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="space-y-8">
              {/* CSV Download Section */}
              <CSVDownload />

              {/* Upload Section */}
              <section>
                <ZapierConfig onWebhookUrlChange={() => {}} />

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
                        <div className="p-3 bg-orange-100 rounded-lg w-fit mx-auto mb-3">
                          <Clipboard className="w-6 h-6 text-orange-600" />
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
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;