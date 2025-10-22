import React from 'react';
import { X, Upload, Wand2 } from 'lucide-react';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadProject: () => void;
  onCreateWithWizard: () => void;
}

const SaveProjectModal: React.FC<SaveProjectModalProps> = ({
  isOpen,
  onClose,
  onUploadProject,
  onCreateWithWizard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl border-2 border-purple-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            💾 Save Project
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg p-2 transition-all"
          >
            <X size={28} />
          </button>
        </div>
        
        <p className="text-gray-700 text-lg mb-8 font-semibold">
          Choose how you'd like to save your project:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Existing Project */}
          <button
            onClick={() => {
              onUploadProject();
              onClose();
            }}
            className="group bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white p-8 rounded-2xl border-b-4 border-blue-800 hover:border-blue-900 shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-all">
                <Upload size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold">Upload Project</h3>
              <p className="text-blue-100 text-sm text-center">
                Upload an existing project file from your computer
              </p>
            </div>
          </button>

          {/* Create with Smart Wizard */}
          <button
            onClick={() => {
              onCreateWithWizard();
              onClose();
            }}
            className="group bg-gradient-to-b from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white p-8 rounded-2xl border-b-4 border-purple-900 hover:border-purple-950 shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-all">
                <Wand2 size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold">Smart Wizard</h3>
              <p className="text-purple-100 text-sm text-center">
                Create a new project using our intelligent wizard
              </p>
            </div>
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-400">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="text-gray-800 font-semibold mb-1">Tip</p>
              <p className="text-gray-700 text-sm">
                The Smart Wizard guides you through creating an optimized BESS configuration based on your specific requirements and constraints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveProjectModal;
