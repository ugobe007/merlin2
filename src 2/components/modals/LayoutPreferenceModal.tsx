import React from 'react';

interface LayoutPreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (preference: 'beginner' | 'advanced') => void;
}

const LayoutPreferenceModal: React.FC<LayoutPreferenceModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">Choose Your Experience</h2>
              <p className="text-blue-100 mt-2">Select the interface that best fits your expertise level</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Beginner Option - Smart Wizard */}
            <div 
              onClick={() => onSelect('beginner')}
              className="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🪄</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Smart Wizard</h3>
                <p className="text-gray-600 mb-6">Perfect for getting started quickly</p>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="font-bold text-blue-800 mb-3">Features:</h4>
                  <ul className="text-left space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Guided 7-step process</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Industry-specific templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Automatic calculations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>AI-powered recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>No technical knowledge required</span>
                    </li>
                  </ul>
                </div>
                
                <button 
                  onClick={() => onSelect('beginner')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:from-cyan-600 hover:to-blue-700 transition-all group-hover:scale-105"
                >
                  Choose Smart Wizard
                </button>
              </div>
            </div>

            {/* Advanced Option - Advanced Quote Builder */}
            <div 
              onClick={() => onSelect('advanced')}
              className="border-2 border-orange-200 rounded-xl p-6 hover:border-orange-400 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Advanced Tools</h3>
                <p className="text-gray-600 mb-6">Full control for power users</p>
                
                <div className="bg-orange-50 rounded-lg p-4 mb-6">
                  <h4 className="font-bold text-orange-800 mb-3">Features:</h4>
                  <ul className="text-left space-y-2 text-sm text-orange-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Direct access to advanced calculator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Full parameter control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Custom configuration options</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Optional AI assistance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Professional-grade tools</span>
                    </li>
                  </ul>
                </div>
                
                <button 
                  onClick={() => onSelect('advanced')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-6 rounded-xl font-bold hover:from-orange-600 hover:to-red-700 transition-all group-hover:scale-105"
                >
                  Choose Advanced Tools
                </button>
              </div>
            </div>
          </div>
          
          {/* Note */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              💡 <strong>Note:</strong> You can always switch between modes later in your account settings. 
              Smart Wizard is always available as an option in Advanced mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutPreferenceModal;