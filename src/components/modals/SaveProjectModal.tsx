import React, { useState } from 'react';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteName: string;
  onSave: (name: string, saveLocation: 'local' | 'portfolio' | 'cloud') => void;
}

const SaveProjectModal: React.FC<SaveProjectModalProps> = ({
  isOpen,
  onClose,
  quoteName,
  onSave,
}) => {
  const [projectName, setProjectName] = useState(quoteName);
  const [saveLocation, setSaveLocation] = useState<'local' | 'portfolio' | 'cloud'>('portfolio');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }
    onSave(projectName, saveLocation);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-blue-400">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b-2 border-blue-400 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-800">
              💾 Save Project
            </h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/50"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Save your BESS project for future reference
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-gray-800"
              placeholder="e.g., Solar BESS 10MW Project"
            />
          </div>

          {/* Save Location Options */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">
              Where would you like to save?
            </label>
            
            <div className="space-y-3">
              {/* Portfolio Option */}
              <button
                onClick={() => setSaveLocation('portfolio')}
                className={`w-full p-4 rounded-xl border-2 text-left ${
                  saveLocation === 'portfolio'
                    ? 'bg-purple-100 border-purple-500'
                    : 'bg-white border-gray-300 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">📊</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Save to Portfolio</h4>
                    <p className="text-sm text-gray-600">Store in your online portfolio (recommended)</p>
                  </div>
                  {saveLocation === 'portfolio' && (
                    <div className="text-purple-600 text-2xl">✓</div>
                  )}
                </div>
              </button>

              {/* Local File Option */}
              <button
                onClick={() => setSaveLocation('local')}
                className={`w-full p-4 rounded-xl border-2 text-left ${
                  saveLocation === 'local'
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-white border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">💾</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Download as File</h4>
                    <p className="text-sm text-gray-600">Save as JSON file to your computer</p>
                  </div>
                  {saveLocation === 'local' && (
                    <div className="text-blue-600 text-2xl">✓</div>
                  )}
                </div>
              </button>

              {/* Cloud Option */}
              <button
                onClick={() => setSaveLocation('cloud')}
                className={`w-full p-4 rounded-xl border-2 text-left ${
                  saveLocation === 'cloud'
                    ? 'bg-green-100 border-green-500'
                    : 'bg-white border-gray-300 hover:border-green-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">☁️</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Save to Cloud</h4>
                    <p className="text-sm text-gray-600">Export to Google Drive, Dropbox, etc.</p>
                  </div>
                  {saveLocation === 'cloud' && (
                    <div className="text-green-600 text-2xl">✓</div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-300">
            <h4 className="font-bold text-gray-800 mb-2">📝 What gets saved?</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• All project inputs and configurations</li>
              <li>• Calculated results and cost breakdowns</li>
              <li>• System specifications and assumptions</li>
              <li>• Date and version information</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 text-white rounded-xl font-bold shadow-lg border-b-4 border-blue-800"
          >
            💾 Save Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveProjectModal;
