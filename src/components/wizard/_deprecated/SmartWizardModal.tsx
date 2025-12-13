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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800/95 via-gray-900/95 to-gray-800/95 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-purple-500/40 shadow-2xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-300 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
            🪄 Smart Project Wizard
          </h2>
          <button 
            onClick={onClose} 
            className="text-purple-300 hover:text-white hover:bg-purple-600/30 rounded-lg p-2 transition-all"
          >
            <X size={28} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-xl p-6 border border-cyan-500/30 backdrop-blur-sm shadow-lg">
            <h3 className="font-bold text-xl text-cyan-300 mb-4 flex items-center">
              <span className="mr-2">🎯</span> Project Overview
            </h3>
            <div className="space-y-2 text-white">
              <p className="text-lg">
                <span className="text-cyan-300/70">Project:</span>{' '}
                <span className="font-semibold">{projectData.quoteName || 'Untitled Project'}</span>
              </p>
              <p className="text-lg">
                <span className="text-cyan-300/70">Power:</span>{' '}
                <span className="font-semibold">{projectData.power}</span>
                {' '}<span className="text-cyan-300/70">|</span>{' '}
                <span className="text-cyan-300/70">Duration:</span>{' '}
                <span className="font-semibold">{projectData.standbyHours}</span>
              </p>
              <p className="text-lg">
                <span className="text-cyan-300/70">Grid Mode:</span>{' '}
                <span className="font-semibold">{projectData.gridMode}</span>
              </p>
              <p className="text-lg">
                <span className="text-cyan-300/70">Location:</span>{' '}
                <span className="font-semibold">{projectData.location}</span>
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-xl p-6 border border-emerald-500/30 backdrop-blur-sm shadow-lg">
            <h3 className="font-bold text-xl text-emerald-300 mb-4 flex items-center">
              <span className="mr-2">🎯</span> Financial Summary
            </h3>
            <div className="space-y-3 text-white">
              <div className="flex justify-between items-center">
                <span className="text-emerald-300/70 text-lg">Total Cost:</span>
                <span className="font-bold text-2xl text-emerald-300">
                  ${results.totalCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-300/70 text-lg">Annual Savings:</span>
                <span className="font-bold text-2xl text-emerald-300">
                  ${results.annualSavings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-300/70 text-lg">ROI Period:</span>
                <span className="font-bold text-2xl text-emerald-300">
                  {results.roiYears.toFixed(1)} years
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 border border-purple-400/30 transform hover:scale-105"
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
