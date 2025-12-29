import React from 'react';
import { X, Upload, FolderOpen } from 'lucide-react';

interface LoadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFromComputer: () => void;
  onUploadFromPortfolio: () => void;
}

const LoadProjectModal: React.FC<LoadProjectModalProps> = ({
  isOpen,
  onClose,
  onUploadFromComputer,
  onUploadFromPortfolio,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl border-2 border-green-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            📂 Load Project
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg p-2 transition-all"
          >
            <X size={28} />
          </button>
        </div>
        
        <p className="text-gray-700 text-lg mb-8 font-semibold">
          Choose where to load your project from:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload from Computer */}
          <button
            onClick={() => {
              onUploadFromComputer();
              onClose();
            }}
            className="group bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white p-8 rounded-2xl border-b-4 border-green-800 hover:border-green-900 shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-all">
                <Upload size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold">From Computer</h3>
              <p className="text-green-100 text-sm text-center">
                Upload a project file from your local device
              </p>
            </div>
          </button>

          {/* Upload from Portfolio */}
          <button
            onClick={() => {
              onUploadFromPortfolio();
              onClose();
            }}
            className="group bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white p-8 rounded-2xl border-b-4 border-blue-800 hover:border-blue-900 shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-all">
                <FolderOpen size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold">From Portfolio</h3>
              <p className="text-blue-100 text-sm text-center">
                Load a previously saved project from your portfolio
              </p>
            </div>
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-400">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="text-gray-800 font-semibold mb-1">Tip</p>
              <p className="text-gray-700 text-sm">
                Your portfolio stores all previously saved projects with their full configurations, making it easy to revisit and modify existing designs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadProjectModal;
