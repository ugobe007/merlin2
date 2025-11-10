import React from 'react';
import AboutMerlin from './AboutMerlin';

interface AboutViewProps {
  onBack: () => void;
  onJoinNow: () => void;
  onStartWizard: () => void;
}

export default function AboutView({ onBack, onJoinNow, onStartWizard }: AboutViewProps) {
  return (
    <div>
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={onBack}
            className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
          >
            ← Back to Home
          </button>
          <button
            onClick={onJoinNow}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            ✨ Join Now
          </button>
        </div>
      </div>
      <AboutMerlin />
    </div>
  );
}