import React from 'react';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { aiStateService, type AIState } from '../../services/aiStateService';

interface AIStatusIndicatorProps {
  currentStep?: string;
  compact?: boolean;
}

const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({ 
  currentStep = 'general',
  compact = false 
}) => {
  const aiState = aiStateService.getAIState().state;
  
  const getStatusConfig = (state: AIState) => {
    switch (state) {
      case 'never-used':
        return {
          icon: AlertCircle,
          color: 'text-gray-500 bg-gray-100',
          borderColor: 'border-gray-300',
          text: 'AI Available',
          description: 'Click to optimize with AI',
          status: 'Not Used'
        };
      case 'analyzing':
      case 'active':
        return {
          icon: Sparkles,
          color: 'text-blue-600 bg-blue-100',
          borderColor: 'border-blue-300',
          text: 'AI Active',
          description: 'AI recommendations ready',
          status: 'Ready'
        };
      case 'applied':
        return {
          icon: CheckCircle,
          color: 'text-green-600 bg-green-100',
          borderColor: 'border-green-300',
          text: 'AI Applied',
          description: 'Configuration optimized',
          status: 'Applied'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500 bg-gray-100',
          borderColor: 'border-gray-300',
          text: 'AI Available',
          description: 'Click to optimize',
          status: 'Available'
        };
    }
  };

  const config = getStatusConfig(aiState);
  const IconComponent = config.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.borderColor} ${config.color} text-sm font-medium`}>
        <IconComponent size={14} />
        <span>{config.status}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.borderColor} ${config.color}`}>
      <div className="flex-shrink-0">
        <IconComponent size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{config.text}</div>
        <div className="text-xs opacity-75">{config.description}</div>
      </div>
    </div>
  );
};

export default AIStatusIndicator;