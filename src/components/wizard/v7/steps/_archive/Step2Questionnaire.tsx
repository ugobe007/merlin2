/**
 * Step 2: Live 16Q Questionnaire
 * 
 * Dynamic questionnaire with live calculation preview
 * Reuses CompleteQuestionRenderer from V6
 */

import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import LiveCalculationPanel from '../live-preview/LiveCalculationPanel';

interface Step2QuestionnaireProps {
  industry: string | null;
  answers: Record<string, any>;
  updateAnswer: (fieldName: string, value: any) => void;
  livePreview: any;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

export default function Step2Questionnaire({
  industry,
  answers,
  updateAnswer,
  livePreview,
  onNext,
  onBack,
  canProceed,
}: Step2QuestionnaireProps) {
  
  const completionPct = Math.round((Object.keys(answers).length / 16) * 100);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tell Me About Your Facility
          </h1>
          <p className="text-gray-600">
            {completionPct}% complete • {Object.keys(answers).length}/16 questions
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Questions Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TODO: Wire to database questions */}
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-gray-500 text-center py-12">
              Questions loading...
              <br />
              <span className="text-sm">
                (Will integrate CompleteQuestionRenderer from V6)
              </span>
            </p>
          </div>

        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-1">
          <LiveCalculationPanel livePreview={livePreview} />
        </div>

      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`
            px-6 py-3 rounded-lg font-medium flex items-center space-x-2
            ${canProceed 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <span>Continue to Configuration</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
