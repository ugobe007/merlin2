import React from 'react';
import { X } from 'lucide-react';

interface SmartWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: {
    quoteName: string;
    power: string;
    standbyHours: string;
    gridMode: string;
    location: string;
    utilization: string;
  };
  results: {
    totalCost: number;
    annualSavings: number;
    roiYears: number;
  };
}

const SmartWizardModal: React.FC<SmartWizardModalProps> = ({
  isOpen,
  onClose,
  projectData,
  results
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800 via-purple-900/50 to-blue-900/50 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-purple-500/30 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🧙‍♂️ Smart Project Wizard
          </h2>
          <button 
            onClick={onClose} 
            className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg p-2 transition-all"
          >
            <X size={28} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-6 border border-blue-500/30 backdrop-blur-sm">
            <h3 className="font-bold text-xl text-blue-300 mb-4 flex items-center">
              <span className="mr-2">📊</span> Project Overview
            </h3>
            <div className="space-y-2 text-white">
              <p className="text-lg">
                <span className="text-blue-300/70">Project:</span>{' '}
                <span className="font-semibold">{projectData.quoteName || 'Untitled Project'}</span>
              </p>
              <p className="text-lg">
                <span className="text-blue-300/70">Power:</span>{' '}
                <span className="font-semibold">{projectData.power}</span>
                {' '}<span className="text-blue-300/70">|</span>{' '}
                <span className="text-blue-300/70">Duration:</span>{' '}
                <span className="font-semibold">{projectData.standbyHours}</span>
              </p>
              <p className="text-lg">
                <span className="text-blue-300/70">Grid Mode:</span>{' '}
                <span className="font-semibold">{projectData.gridMode}</span>
              </p>
              <p className="text-lg">
                <span className="text-blue-300/70">Location:</span>{' '}
                <span className="font-semibold">{projectData.location}</span>
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-800/20 rounded-xl p-6 border border-green-500/30 backdrop-blur-sm">
            <h3 className="font-bold text-xl text-green-300 mb-4 flex items-center">
              <span className="mr-2">💰</span> Financial Summary
            </h3>
            <div className="space-y-3 text-white">
              <div className="flex justify-between items-center">
                <span className="text-green-300/70 text-lg">Total Cost:</span>
                <span className="font-bold text-2xl text-green-300">
                  ${results.totalCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-300/70 text-lg">Annual Savings:</span>
                <span className="font-bold text-2xl text-green-300">
                  ${results.annualSavings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-300/70 text-lg">ROI Period:</span>
                <span className="font-bold text-2xl text-green-300">
                  {results.roiYears.toFixed(1)} years
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-br from-purple-600/80 to-blue-600/80 text-white rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all border-b-4 border-purple-700/50 hover:border-purple-500"
            >
              ✨ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartWizardModal;
