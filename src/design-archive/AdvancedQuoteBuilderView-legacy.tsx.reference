import React from 'react';
import type { JSX } from 'react';

interface AdvancedQuoteBuilderViewProps {
  onBackToHome: () => void;
  onShowSmartWizard: () => void;
  onShowTemplates: () => void;
  onShowAnalytics: () => void;
  onShowFinancing: () => void;
  renderMainQuoteForm: () => JSX.Element;
}

export default function AdvancedQuoteBuilderView({ 
  onBackToHome, 
  onShowSmartWizard, 
  onShowTemplates, 
  onShowAnalytics, 
  onShowFinancing,
  renderMainQuoteForm 
}: AdvancedQuoteBuilderViewProps) {
  
  // Debug logging
  React.useEffect(() => {
    console.log('AdvancedQuoteBuilderView handlers:', {
      onShowTemplates: !!onShowTemplates,
      onShowAnalytics: !!onShowAnalytics,
      onShowFinancing: !!onShowFinancing,
    });
  }, [onShowTemplates, onShowAnalytics, onShowFinancing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative" style={{ zIndex: 1 }}>
      {/* Advanced Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 shadow-lg relative" style={{ zIndex: 2 }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">⚡ Advanced Quote Builder</h1>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Power User Mode</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onShowSmartWizard}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              🎯 Smart Wizard
            </button>
            <button
              onClick={onBackToHome}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Quote Builder Content - Scrollable to main form */}
      <div className="max-w-7xl mx-auto p-6 relative" style={{ zIndex: 1 }}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative" style={{ zIndex: 1 }}>
          {/* Quick Actions Header */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 border-b relative" style={{ zIndex: 2 }}>
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">Advanced Configuration</h2>
                <div className="flex gap-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">AI Available</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Full Control</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="relative" style={{ zIndex: 10 }}>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Templates button clicked');
                      onShowTemplates();
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ position: 'relative', zIndex: 10 }}
                  >
                    📋 Templates
                  </button>
                </div>
                <div className="relative" style={{ zIndex: 10 }}>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Analytics button clicked');
                      onShowAnalytics();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ position: 'relative', zIndex: 10 }}
                  >
                    📊 Analytics
                  </button>
                </div>
                <div className="relative" style={{ zIndex: 10 }}>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Financing button clicked');
                      onShowFinancing();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ position: 'relative', zIndex: 10 }}
                  >
                    🎯 Financing
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll to main quote builder form */}
          <div className="h-screen overflow-y-auto relative" style={{ zIndex: 1 }}>
            {/* Main form content will be rendered here */}
            {renderMainQuoteForm()}
          </div>
        </div>
      </div>
    </div>
  );
}