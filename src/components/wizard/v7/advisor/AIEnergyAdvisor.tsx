/**
 * AI Energy Advisor Component
 * 
 * Conversational AI personality that guides users through the wizard.
 * Context-aware messages based on current step, industry, and answers.
 * 
 * Design:
 * - Friendly avatar with animations
 * - Context-aware messaging
 * - Helpful tips and insights
 * - Personality: Professional yet approachable
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import AdvisorAvatar from './AdvisorAvatar';

interface AIEnergyAdvisorProps {
  currentStep: number;
  industry: string | null;
  livePreview: any;
  answers: Record<string, any>;
  compact?: boolean;
}

export default function AIEnergyAdvisor({
  currentStep,
  industry,
  livePreview,
  answers,
  compact = false,
}: AIEnergyAdvisorProps) {
  const [message, setMessage] = useState<string>('');
  const [icon, setIcon] = useState<React.ReactNode>(<Sparkles className="w-5 h-5" />);

  /**
   * Generate context-aware message
   */
  useEffect(() => {
    const newMessage = generateMessage(currentStep, industry, livePreview, answers);
    setMessage(newMessage.text);
    setIcon(newMessage.icon);
  }, [currentStep, industry, livePreview, answers]);

  if (compact) {
    // Mobile compact view
    return (
      <div className="flex items-center space-x-3">
        <AdvisorAvatar size="sm" />
        <div className="flex-1">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <div className="text-blue-500">{icon}</div>
      </div>
    );
  }

  // Desktop full view
  return (
    <div className="sticky top-8">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100">
        
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <AdvisorAvatar size="lg" />
        </div>

        {/* Name */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Merlin</h3>
          <p className="text-sm text-gray-600">Your Energy Advisor</p>
        </div>

        {/* Message */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-start space-x-2">
            <div className="text-blue-500 mt-0.5">{icon}</div>
            <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Live Preview Stats (if available) */}
        {livePreview && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Peak Demand</span>
              <span className="font-bold text-gray-900">
                {Math.round(livePreview.peakKW)} kW
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">BESS Size</span>
              <span className="font-bold text-gray-900">
                {Math.round(livePreview.bessKWh)} kWh
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Confidence</span>
              <span className="font-bold text-green-600">
                {Math.round(livePreview.confidence * 100)}%
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * Generate Context-Aware Message
 */
function generateMessage(
  step: number, 
  industry: string | null, 
  livePreview: any,
  answers: Record<string, any>
) {
  // Step 0: Welcome
  if (step === 0) {
    return {
      text: "Welcome! I'm Merlin, your energy advisor. Let's start by understanding your facility's location and industry. This helps me provide accurate savings estimates.",
      icon: <Sparkles className="w-5 h-5" />,
    };
  }

  // Step 1: Opportunity
  if (step === 1) {
    const industryName = industry ? industry.replace('-', ' ') : 'your industry';
    return {
      text: `Great choice! ${capitalize(industryName)} facilities typically see significant savings with battery energy storage. Let me show you what's possible.`,
      icon: <TrendingUp className="w-5 h-5" />,
    };
  }

  // Step 2: Questionnaire
  if (step === 2) {
    const answerCount = Object.keys(answers).length;
    
    if (answerCount < 4) {
      return {
        text: "Perfect! Now let's gather some details about your facility. I'll calculate your energy profile in real-time as you answer.",
        icon: <Zap className="w-5 h-5" />,
      };
    } else if (answerCount < 12) {
      return {
        text: `Great progress! ${answerCount}/16 questions answered. I'm already seeing your energy profile take shape. Keep going!`,
        icon: <Zap className="w-5 h-5" />,
      };
    } else {
      return {
        text: "Almost there! Just a few more questions and I'll have a complete picture of your energy needs.",
        icon: <CheckCircle className="w-5 h-5" />,
      };
    }
  }

  // Step 3: Configuration
  if (step === 3) {
    return {
      text: "Excellent! Based on your answers, I've prepared three configuration options. The 'Recommended' option balances cost and savings optimally.",
      icon: <CheckCircle className="w-5 h-5" />,
    };
  }

  // Step 4: Results
  if (step === 4) {
    return {
      text: "All done! Your custom quote is ready. You can export it as PDF, Word, or Excel to share with your team or stakeholders.",
      icon: <CheckCircle className="w-5 h-5" />,
    };
  }

  // Default
  return {
    text: "I'm here to help you find the perfect energy solution!",
    icon: <Sparkles className="w-5 h-5" />,
  };
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
