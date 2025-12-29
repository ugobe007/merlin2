import React, { useState, useMemo } from 'react';
import { X, HelpCircle, CheckCircle } from 'lucide-react';

interface Question {
  id: string;
  fieldName: string;
  questionText: string;
  helpText?: string;
  questionType: 'select' | 'dropdown' | 'toggle' | 'slider' | 'yes_no' | 'number' | 'multiselect' | 'boolean' | 'compound';
  options?: any[];
  minValue?: number;
  maxValue?: number;
  defaultValue?: any;
  unit?: string;
  isRequired?: boolean;
}

interface AdvancedQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  useCaseData: Record<string, any>;
  onDataChange: (field: string, value: any) => void;
  industryName?: string;
}

export const AdvancedQuestionsModal: React.FC<AdvancedQuestionsModalProps> = ({
  isOpen,
  onClose,
  questions,
  useCaseData,
  onDataChange,
  industryName = 'Hotel',
}) => {
  const [localData, setLocalData] = useState<Record<string, any>>(useCaseData);

  // Filter to only advanced questions (explicitly marked in metadata)
  const advancedQuestions = useMemo(() => {
    return questions.filter(q => {
      // Only include questions explicitly marked as advanced
      const metadata = (q as any).metadata;
      return metadata?.is_advanced === true;
    });
  }, [questions]);

  const handleChange = (field: string, value: any) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onDataChange(field, value);
  };

  const handleSave = () => {
    // Save all changes
    Object.keys(localData).forEach(key => {
      if (localData[key] !== useCaseData[key]) {
        onDataChange(key, localData[key]);
      }
    });
    onClose();
  };

  const handleCancel = () => {
    // Revert to original data
    setLocalData(useCaseData);
    onClose();
  };

  const answeredCount = useMemo(() => {
    return advancedQuestions.filter(q => {
      const value = localData[q.fieldName];
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [advancedQuestions, localData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-400/60 ring-4 ring-purple-500/20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 text-white p-6 rounded-t-xl z-10 border-b-4 border-purple-400">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
                <HelpCircle className="w-8 h-8" />
                Advanced {industryName} Details
              </h2>
              <p className="text-purple-200 text-sm">
                These optional questions help us provide a more detailed quote. You can skip these if you prefer.
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-white hover:bg-white/20 rounded-lg px-4 py-2 transition-all text-2xl font-bold ml-4"
            >
              ✕
            </button>
          </div>
          
          {/* Progress */}
          <div className="mt-4 bg-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-200 text-sm">Questions answered</span>
              <span className="text-white font-semibold">{answeredCount}/{advancedQuestions.length}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-300 to-pink-300 transition-all duration-300"
                style={{ width: `${advancedQuestions.length > 0 ? (answeredCount / advancedQuestions.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {advancedQuestions.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-white/10">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-white text-lg font-semibold mb-2">No advanced questions available</p>
              <p className="text-white/60">All essential questions are shown in the main form.</p>
            </div>
          ) : (
            advancedQuestions.map((question) => {
              const value = localData[question.fieldName];
              const options = question.options || [];
              
              return (
                <div 
                  key={question.id} 
                  className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 p-6 rounded-xl border-2 border-purple-400/40 shadow-lg backdrop-blur-sm"
                >
                  <div className="mb-4">
                    <label className="block text-lg font-semibold text-white mb-1">
                      {question.questionText}
                    </label>
                    {question.helpText && (
                      <p className="text-sm text-purple-200">{question.helpText}</p>
                    )}
                  </div>
                  
                  {/* Render appropriate input based on question type */}
                  {question.questionType === 'select' || question.questionType === 'dropdown' ? (
                    <select
                      value={value || ''}
                      onChange={(e) => handleChange(question.fieldName, e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/60 border-2 border-purple-400/50 rounded-xl text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    >
                      <option value="">Select an option...</option>
                      {options.map((opt: any, idx: number) => {
                        const optValue = typeof opt === 'object' ? opt.value : opt;
                        const optLabel = typeof opt === 'object' ? opt.label : opt;
                        return (
                          <option key={idx} value={optValue} className="bg-slate-800">
                            {optLabel}
                          </option>
                        );
                      })}
                    </select>
                  ) : question.questionType === 'multiselect' ? (
                    <div className="space-y-2">
                      {options.map((opt: any, idx: number) => {
                        const optValue = typeof opt === 'object' ? opt.value : opt;
                        const optLabel = typeof opt === 'object' ? opt.label : opt;
                        const isSelected = Array.isArray(value) ? value.includes(optValue) : false;
                        
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const current = Array.isArray(value) ? value : [];
                              const updated = isSelected
                                ? current.filter((v: any) => v !== optValue)
                                : [...current, optValue];
                              handleChange(question.fieldName, updated);
                            }}
                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? 'bg-gradient-to-r from-purple-500/30 to-violet-500/30 border-purple-400 text-white'
                                : 'bg-slate-700/50 border-slate-500/50 text-gray-300 hover:border-purple-400/50'
                            }`}
                          >
                            {optLabel}
                          </button>
                        );
                      })}
                    </div>
                  ) : question.questionType === 'number' ? (
                    <input
                      type="number"
                      value={value || ''}
                      onChange={(e) => handleChange(question.fieldName, parseFloat(e.target.value) || 0)}
                      min={question.minValue}
                      max={question.maxValue}
                      className="w-full px-4 py-3 bg-slate-700/60 border-2 border-purple-400/50 rounded-xl text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => handleChange(question.fieldName, e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/60 border-2 border-purple-400/50 rounded-xl text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-b-xl border-t-4 border-purple-400/50 flex justify-end gap-4">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-white font-semibold transition-all border-2 border-slate-500/50"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-xl text-white font-bold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

