import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { aiStateService } from '@/services/aiStateService';
import AIStatusIndicator from '../../wizard/AIStatusIndicator';
import { useCaseService } from '@/services/useCaseService';
import QuestionRenderer from '../../wizard/QuestionRenderer';
import AIRecommendationPanel from '../../wizard/AIRecommendationPanel';

// Import use case images with explicit extensions for Vite
import evChargingStationImage from '@/assets/images/ev_charging_station.png?url';
import carWashImage from '@/assets/images/car_wash_1.jpg?url';
import hospitalImage from '@/assets/images/hospital_1.jpg?url';
import hotelImage from '@/assets/images/hotel_1.avif?url';
import airportImage from '@/assets/images/airports_1.jpg?url';

interface Step2_UseCaseProps {
  selectedIndustry: string;
  useCaseData: { [key: string]: any };
  setUseCaseData: (data: { [key: string]: any }) => void;
  aiRecommendation?: {
    message: string;
    savings: string;
    roi: string;
    configuration: string;
  } | null;
  // Optional: Allow AI to auto-configure system from this step
  setStorageSizeMW?: (value: number) => void;
  setDurationHours?: (value: number) => void;
  onAdvanceToConfiguration?: () => void;
}

const Step2_UseCase: React.FC<Step2_UseCaseProps> = ({ 
  selectedIndustry, 
  useCaseData, 
  setUseCaseData, 
  aiRecommendation,
  setStorageSizeMW,
  setDurationHours,
  onAdvanceToConfiguration,
}) => {
  // Helper function to get industry image
  const getIndustryImage = (industry: string): string | null => {
    switch (industry) {
      case 'ev-charging':
        return evChargingStationImage;
      case 'car-wash':
        return carWashImage;
      case 'hospital':
        return hospitalImage;
      case 'hotel':
        return hotelImage;
      case 'airport':
        return airportImage;
      default:
        return null;
    }
  };

  // Removed AI assistance - keeping wizard simple and focused

  // State for loading questions from database
  const [useCaseConfig, setUseCaseConfig] = useState<any>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Fetch questions from Supabase database
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const useCaseDetails = await useCaseService.getUseCaseBySlug(selectedIndustry);
        
        if (useCaseDetails) {
          setUseCaseConfig({
            title: useCaseDetails.name,
            icon: useCaseDetails.icon || '📋',
            questions: useCaseDetails.custom_questions || []
          });
          
          if (import.meta.env.DEV) {
            console.log('✅ [Step2_UseCase] Loaded questions from Supabase:', {
              slug: selectedIndustry,
              name: useCaseDetails.name,
              questionCount: useCaseDetails.custom_questions?.length,
              requiredCount: useCaseDetails.custom_questions?.filter((q: any) => q.required).length,
              questions: useCaseDetails.custom_questions
            });
          }
          
          // ✅ SYSTEMATIC FIX: Store for parent validation
          (window as any).__currentUseCaseDetails = useCaseDetails;
          
          // ✅ Apply default values from database to fix empty select fields
          const defaults: { [key: string]: any } = {};
          useCaseDetails.custom_questions?.forEach((q: any) => {
            if (q.default && !useCaseData[q.id]) {
              defaults[q.id] = q.default;
            }
          });
          if (Object.keys(defaults).length > 0) {
            setUseCaseData({ ...useCaseData, ...defaults });
          }
        } else {
          console.warn('⚠️ [Step2_UseCase] No use case found for slug:', selectedIndustry);
        }
      } catch (error) {
        console.error('❌ [Step2_UseCase] Error loading questions:', error);
      } finally {
        setLoadingQuestions(false);
      }
    };
    
    if (selectedIndustry) {
      loadQuestions();
    }
  }, [selectedIndustry]);

  const handleInputChange = (key: string, value: any) => {
    setUseCaseData({ ...useCaseData, [key]: value });
  };

  // Accept AI configuration and advance to configuration page
  const handleAcceptAIConfiguration = (mw: number, hours: number) => {
    if (setStorageSizeMW && setDurationHours) {
      setStorageSizeMW(mw);
      setDurationHours(hours);
    }
  };

  // Show loading state while fetching questions
  if (loadingQuestions || !useCaseConfig) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  // Get use case configuration from centralized templates
  // ⚠️ DEPRECATED: Now loading from Supabase instead of hardcoded templates
  // const useCaseConfig = getUseCaseQuestionnaire(selectedIndustry);
  
  // Debug logging
  if (import.meta.env.DEV) {
    console.log('🔍 [Step2_UseCase] useCaseConfig:', useCaseConfig);
    console.log('🔍 [Step2_UseCase] Questions count:', useCaseConfig.questions?.length);
    console.log('🔍 [Step2_UseCase] Questions:', useCaseConfig.questions);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-4">
          {/* Industry Image (if available) */}
          {getIndustryImage(selectedIndustry) && (
            <div className="w-16 h-16 rounded-lg overflow-hidden shadow-lg border-2 border-white">
              <img 
                src={getIndustryImage(selectedIndustry)!} 
                alt={useCaseConfig.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {/* Industry Icon */}
          <div className="text-6xl">{useCaseConfig.icon}</div>
        </div>
        <div className="flex justify-center items-center gap-3 mb-2">
          <h2 className="text-3xl font-bold text-gray-900">
            {useCaseConfig.title}
          </h2>
          <AIStatusIndicator compact={true} />
        </div>
        <p className="text-gray-600 text-lg">
          Tell us about your operation to recommend the optimal system
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {useCaseConfig.questions?.length > 0 ? (
          useCaseConfig.questions
            .filter((question: any) => {
              // Handle conditional questions
              if (!question.conditional) return true;
              
              const { field, operator, value, dependsOn } = question.conditional;
              
              if (dependsOn) {
                // Legacy format: dependsOn field
                return useCaseData[dependsOn] === value;
              } else if (field && operator) {
                // New format: field with operator
                const fieldValue = useCaseData[field];
                
                switch (operator) {
                  case '>':
                    return fieldValue > value;
                  case '<':
                    return fieldValue < value;
                  case '==':
                    return fieldValue === value;
                  case '!=':
                    return fieldValue !== value;
                  case '>=':
                    return fieldValue >= value;
                  case '<=':
                    return fieldValue <= value;
                  default:
                    return true;
                }
              }
              
              return true;
            })
            .map((question: any) => {
              return (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  value={useCaseData[question.id] || question.default || ''}
                  selectedIndustry={selectedIndustry}
                  useCaseData={useCaseData}
                  onChange={handleInputChange}
                />
              );
            })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">⚠️ No questions found for this use case</p>
            <p className="text-sm">Template: {selectedIndustry}</p>
          </div>
        )}
      </div>

      {/* AI Recommendation Panel removed - keeping wizard simple */}
    </div>
  );
};

export default Step2_UseCase;
