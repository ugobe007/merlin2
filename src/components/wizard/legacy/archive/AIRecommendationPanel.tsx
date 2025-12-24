import React, { useState } from 'react';
import { Sparkles, Lightbulb, TrendingUp } from 'lucide-react';
import { aiStateService } from '@/services/aiStateService';

interface AIRecommendation {
  message: string;
  savings: string;
  roi: string;
  configuration: string;
}

interface AIRecommendationPanelProps {
  aiRecommendation: AIRecommendation | null;
  onAccept?: (mw: number, hours: number) => void;
  onAdvanceToConfiguration?: () => void;
}

/**
 * AI Recommendation Panel Component
 * 
 * Displays AI-generated system recommendations with:
 * - Configuration message
 * - Potential savings
 * - ROI timeline
 * - Recommended system size
 * - Accept button with confirmation modal
 */
const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
  aiRecommendation,
  onAccept,
  onAdvanceToConfiguration,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  if (!aiRecommendation) {
    return null;
  }

  // Parse AI configuration string to extract MW and hours
  const parseAIConfiguration = (configString: string) => {
    if (!configString) return null;
    
    const mwMatch = configString.match(/(\d+\.?\d*)MW/);
    const hrMatch = configString.match(/(\d+)hr/);
    
    if (mwMatch && hrMatch) {
      return {
        mw: parseFloat(mwMatch[1]),
        hours: parseInt(hrMatch[1])
      };
    }
    return null;
  };

  const aiConfig = parseAIConfiguration(aiRecommendation.configuration);

  const handleAcceptAIConfiguration = () => {
    if (!aiConfig || !onAccept) return;

    setIsApplying(true);
    
    // Apply the configuration
    onAccept(aiConfig.mw, aiConfig.hours);
    
    // Update AI state to applied
    aiStateService.setAIState('applied', {
      appliedConfig: `${aiConfig.mw}MW / ${aiConfig.hours}hr`
    });
    
    // Close modal and advance after brief delay
    setTimeout(() => {
      setShowConfirmModal(false);
      setIsApplying(false);
      if (onAdvanceToConfiguration) {
        onAdvanceToConfiguration();
      }
    }, 1500);
  };

  return (
    <>
      {/* AI Recommendation Display */}
      <div className="mt-8 bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 rounded-2xl p-8 border-2 border-purple-300 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-full">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              AI Recommendation for Your Project
            </h3>
            
            <div className="bg-white rounded-xl p-6 mb-4 shadow-md">
              <p className="text-gray-700 text-lg leading-relaxed">
                {aiRecommendation.message}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-green-100 rounded-xl p-4 border-2 border-green-300">
                <div className="text-green-700 font-semibold text-sm mb-1">Potential Savings</div>
                <div className="text-2xl font-bold text-green-900">{aiRecommendation.savings}</div>
              </div>
              <div className="bg-blue-100 rounded-xl p-4 border-2 border-blue-300">
                <div className="text-blue-700 font-semibold text-sm mb-1">ROI Timeline</div>
                <div className="text-2xl font-bold text-blue-900">{aiRecommendation.roi}</div>
              </div>
              <div className="bg-purple-100 rounded-xl p-4 border-2 border-purple-300">
                <div className="text-purple-700 font-semibold text-sm mb-1">Recommended System</div>
                <div className="text-xl font-bold text-purple-900">{aiRecommendation.configuration}</div>
              </div>
            </div>

            {/* Accept AI Configuration Button */}
            {aiConfig && onAccept && (
              <div className="mt-6">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Accept AI Configuration & Configure System
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm">Based on industry benchmarks and your specific use case</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && aiConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-green-100 to-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Accept AI Configuration?</h3>
              <p className="text-gray-600">This will automatically configure your energy storage system based on our AI analysis.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What This Does:
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  Sets your system size to <strong>{aiConfig.mw}MW</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  Sets storage duration to <strong>{aiConfig.hours} hours</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  Advances you to the <strong>Configuration page</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  You can still <strong>adjust the settings</strong> if needed
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptAIConfiguration}
                disabled={isApplying}
                className={`flex-1 ${
                  isApplying 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                } text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2`}
              >
                {isApplying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Applying & Advancing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept & Configure
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIRecommendationPanel;
