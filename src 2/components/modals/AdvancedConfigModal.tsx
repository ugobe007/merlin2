import React, { useState } from 'react';
import type { UploadedDocument } from '../upload/DocumentUploadModal';
import DocumentUploadModal from '../upload/DocumentUploadModal';
import type { AdvancedConfig } from '../../hooks/useAdvancedConfig';

// Manually define interfaces here since the imports are missing
// interface UploadedDocument {
//   name: string;
//   size: number;
//   aiSuggestions: string[];
//   extractedData: {
//     projectName?: string;
//     customerName?: string;
//     location?: string;
//     powerRequirement?: string;
//     voltage?: string;
//   };
// }

// export interface AdvancedConfig {
//   projectReference: string;
//   customerName: string;
//   siteLocation: string;
//   powerMW: string;
//   energyMWh: string;
//   voltage: string;
//   projectDescription: string;
//   executiveSummary: string;
//   technicalSpecifications: string;
//   commercialTerms: string;
// }

interface AdvancedConfigModalProps {
  config: AdvancedConfig;
  setConfig: (config: AdvancedConfig) => void;
  onClose: () => void;
  onSave: (config: AdvancedConfig) => void;
}

const AdvancedConfigModal: React.FC<AdvancedConfigModalProps> = ({
  config,
  setConfig,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('project');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  const handleDocumentUpload = (documents: UploadedDocument[]) => {
    setUploadedDocuments(prev => [...prev, ...documents]);
    
    // Extract AI suggestions from all documents
    const allSuggestions = documents.flatMap(doc => doc.aiSuggestions);
    setAiSuggestions(prev => [...prev, ...allSuggestions]);
    
    // Auto-fill form fields from extracted data
    if (documents.length > 0) {
      const extractedData = documents[0].extractedData;
      setConfig({
        ...config,
        projectReference: extractedData.projectName || config.projectReference,
        customerName: extractedData.customerName || config.customerName,
        siteLocation: extractedData.location || config.siteLocation,
        powerMW: extractedData.powerRequirement || config.powerMW,
        voltage: extractedData.voltage || config.voltage,
      });
      setShowAiAssistant(true);
    }
  };

  const applyAiSuggestion = (suggestion: string) => {
    // Apply AI suggestion to relevant field
    if (suggestion.includes('executive summary')) {
      setConfig({
        ...config,
        executiveSummary: config.executiveSummary + '\n\n' + suggestion
      });
    } else if (suggestion.includes('technical')) {
      setConfig({
        ...config,
        technicalSpecifications: config.technicalSpecifications + '\n\n' + suggestion
      });
    }
  };

  const optimizeWithAI = async () => {
    // Simulate AI optimization
    const optimizedConfig = {
      ...config,
      executiveSummary: config.executiveSummary + '\n\n[AI-Enhanced] This project represents a strategic investment in sustainable energy infrastructure, designed to deliver optimal performance and long-term value.',
      technicalSpecifications: config.technicalSpecifications + '\n\n[AI-Enhanced] System includes advanced monitoring, predictive maintenance capabilities, and seamless grid integration features.'
    };
    setConfig(optimizedConfig);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">⚙️ Advanced Quote Configuration</h2>
                <p className="text-purple-100 mt-1">Professional quote customization with AI assistance</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 text-3xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Document Upload Button */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                📄 Upload Documents
              </button>
              {uploadedDocuments.length > 0 && (
                <button
                  onClick={() => setShowAiAssistant(!showAiAssistant)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  🤖 AI Assistant ({aiSuggestions.length})
                </button>
              )}
            </div>
          </div>

          <div className="flex h-[calc(95vh-160px)]">
            {/* Sidebar */}
            <div className="w-1/4 bg-gray-50 border-r border-gray-200 p-4">
              
              {/* Navigation Tabs */}
              <div className="space-y-2 mb-6">
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTab === 'project' 
                      ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-500' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('project')}
                >
                  📋 Project Details
                </button>
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTab === 'content' 
                      ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-500' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('content')}
                >
                  📝 Quote Content
                </button>
              </div>

              {/* Uploaded Documents */}
              {uploadedDocuments.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📁 Documents ({uploadedDocuments.length})</h3>
                  <div className="space-y-1">
                    {uploadedDocuments.map((doc, index) => (
                      <div key={index} className="text-xs bg-white p-2 rounded border">
                        <p className="font-medium truncate">{doc.name}</p>
                        <p className="text-gray-500">{(doc.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Assistant Panel */}
              {showAiAssistant && aiSuggestions.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                    🤖 AI Suggestions
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="text-xs">
                        <p className="text-gray-600 mb-1">{suggestion}</p>
                        <button
                          onClick={() => applyAiSuggestion(suggestion)}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={optimizeWithAI}
                    className="w-full mt-2 bg-green-500 text-white text-xs py-1 rounded hover:bg-green-600 transition"
                  >
                    ✨ Optimize All
                  </button>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'project' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Project Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Project Reference</label>
                      <input
                        type="text"
                        value={config.projectReference}
                        onChange={(e) => setConfig({...config, projectReference: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Project Alpha-2024"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
                      <input
                        type="text"
                        value={config.customerName}
                        onChange={(e) => setConfig({...config, customerName: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., ABC Energy Corp"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Site Location</label>
                      <input
                        type="text"
                        value={config.siteLocation}
                        onChange={(e) => setConfig({...config, siteLocation: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., California, USA"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Power (MW)</label>
                      <input
                        type="text"
                        value={config.powerMW}
                        onChange={(e) => setConfig({...config, powerMW: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 5"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Energy (MWh)</label>
                      <input
                        type="text"
                        value={config.energyMWh}
                        onChange={(e) => setConfig({...config, energyMWh: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Voltage</label>
                      <select
                        value={config.voltage}
                        onChange={(e) => setConfig({...config, voltage: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="480V">480V</option>
                        <option value="4160V">4160V</option>
                        <option value="13.8kV">13.8kV</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Project Description</label>
                    <textarea
                      value={config.projectDescription}
                      onChange={(e) => setConfig({...config, projectDescription: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                      placeholder="Describe the project scope, objectives, and key requirements..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">Quote Content</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Executive Summary</label>
                    <textarea
                      value={config.executiveSummary}
                      onChange={(e) => setConfig({...config, executiveSummary: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={6}
                      placeholder="Provide a compelling executive summary highlighting key value propositions..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Technical Specifications</label>
                    <textarea
                      value={config.technicalSpecifications}
                      onChange={(e) => setConfig({...config, technicalSpecifications: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={6}
                      placeholder="Detail the technical specifications, performance parameters, and system architecture..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Commercial Terms</label>
                    <textarea
                      value={config.commercialTerms}
                      onChange={(e) => setConfig({...config, commercialTerms: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                      placeholder="Outline pricing, payment terms, delivery schedule, and warranties..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {uploadedDocuments.length > 0 && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ {uploadedDocuments.length} documents processed
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(config)}
                className="px-8 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold"
              >
                Apply Configuration
              </button>
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleDocumentUpload}
        />
      )}
    </>
  );
};

export default AdvancedConfigModal;
