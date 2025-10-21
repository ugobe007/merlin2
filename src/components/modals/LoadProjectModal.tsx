import React from 'react';

interface LoadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: () => void;
  onSelectFromPortfolio: () => void;
  onCreateWithWizard: () => void;
}

const LoadProjectModal: React.FC<LoadProjectModalProps> = ({
  isOpen,
  onClose,
  onUploadFile,
  onSelectFromPortfolio,
  onCreateWithWizard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-400">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 border-b-2 border-gray-400 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-800">
              📂 Load Project
            </h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/50"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Choose how you'd like to load your BESS project
          </p>
        </div>

        {/* Options */}
        <div className="p-8 space-y-6">
          {/* Option 1: Upload from Computer/Cloud */}
          <button
            onClick={onUploadFile}
            className="w-full bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-400 text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="text-5xl">📤</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-700">
                  Upload from Computer or Cloud
                </h3>
                <p className="text-gray-600">
                  Load a previously saved project file (.json) from your computer or cloud storage.
                  Perfect for importing projects you've worked on before.
                </p>
                <div className="mt-3 text-blue-600 font-semibold">
                  → Click to browse files
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Select from Portfolio */}
          <button
            onClick={onSelectFromPortfolio}
            className="w-full bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-400 text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="text-5xl">📊</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-purple-700">
                  Select from Portfolio
                </h3>
                <p className="text-gray-600">
                  Browse and load projects from your saved portfolio. View all your previous
                  quotes, compare them, and continue where you left off.
                </p>
                <div className="mt-3 text-purple-600 font-semibold">
                  → View your portfolio
                </div>
              </div>
            </div>
          </button>

          {/* Option 3: Create with Smart Wizard */}
          <button
            onClick={onCreateWithWizard}
            className="w-full bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border-2 border-green-400 text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="text-5xl">🪄</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-green-700">
                  Create Your Own Proposal
                </h3>
                <p className="text-gray-600">
                  Start fresh with our Smart Wizard! Build a new BESS project step-by-step
                  with intelligent recommendations and real-time calculations.
                </p>
                <div className="mt-3 text-green-600 font-semibold">
                  → Launch Smart Wizard
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-2xl border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            Need help? Check our documentation or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadProjectModal;
