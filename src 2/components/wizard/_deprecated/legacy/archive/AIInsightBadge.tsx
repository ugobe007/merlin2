/**
 * AI Insight Badge Component
 * 
 * Displays contextual AI suggestions within the wizard flow
 */

import React from 'react';
import { Sparkles, CheckCircle, AlertTriangle, Info, Lightbulb } from 'lucide-react';

export type AIInsightType = 'success' | 'warning' | 'info' | 'suggestion' | 'optimal';

export interface AIInsightBadgeProps {
  type: AIInsightType;
  title?: string;
  message: string;
  suggestion?: {
    label: string;
    onAccept: () => void;
  };
  confidence?: 'high' | 'medium' | 'low';
  className?: string;
}

/**
 * AIInsightBadge - Contextual AI guidance component
 * 
 * Usage:
 * <AIInsightBadge
 *   type="suggestion"
 *   message="Consider 5.4MW for better ROI"
 *   suggestion={{ label: "Apply", onAccept: () => adjustConfig() }}
 * />
 */
export const AIInsightBadge: React.FC<AIInsightBadgeProps> = ({
  type,
  title,
  message,
  suggestion,
  confidence,
  className = ''
}) => {
  // Styling based on type
  const styles = {
    success: {
      container: 'bg-green-50 border-green-300 text-green-900',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      titleColor: 'text-green-800',
      buttonStyle: 'bg-green-600 hover:bg-green-700 text-white'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-300 text-yellow-900',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      titleColor: 'text-yellow-800',
      buttonStyle: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      container: 'bg-blue-50 border-blue-300 text-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      titleColor: 'text-blue-800',
      buttonStyle: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    suggestion: {
      container: 'bg-purple-50 border-purple-300 text-purple-900',
      icon: <Lightbulb className="w-5 h-5 text-purple-600" />,
      titleColor: 'text-purple-800',
      buttonStyle: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    optimal: {
      container: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      titleColor: 'text-emerald-800',
      buttonStyle: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    }
  };

  const currentStyle = styles[type];

  // Confidence indicator (only show for suggestions)
  const confidenceIndicator = confidence && type === 'suggestion' ? (
    <span className="text-xs font-medium opacity-70">
      {confidence === 'high' ? '⚡ High confidence' : 
       confidence === 'medium' ? '💡 Medium confidence' : 
       '🤔 Low confidence'}
    </span>
  ) : null;

  return (
    <div className={`${currentStyle.container} border rounded-lg p-4 flex items-start gap-3 ${className}`}>
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {currentStyle.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <div className={`font-semibold text-sm mb-1 ${currentStyle.titleColor}`}>
            {title}
          </div>
        )}
        <div className="text-sm leading-relaxed">
          {message}
        </div>
        {confidenceIndicator && (
          <div className="mt-2">
            {confidenceIndicator}
          </div>
        )}
      </div>

      {/* Action Button */}
      {suggestion && (
        <button
          onClick={suggestion.onAccept}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${currentStyle.buttonStyle}`}
        >
          {suggestion.label}
        </button>
      )}
    </div>
  );
};

/**
 * AIOptimizationButton - Single button to trigger AI optimization
 * 
 * Usage:
 * <AIOptimizationButton
 *   onOptimize={async () => { ... }}
 *   isLoading={loading}
 * />
 */
export interface AIOptimizationButtonProps {
  onOptimize: () => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AIOptimizationButton: React.FC<AIOptimizationButtonProps> = ({
  onOptimize,
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      onClick={onOptimize}
      disabled={disabled || isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 
        bg-gradient-to-r from-purple-600 to-pink-600 
        hover:from-purple-700 hover:to-pink-700 
        text-white rounded-lg font-semibold 
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isLoading ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <Sparkles className="w-4 h-4" />
      {isLoading ? 'Optimizing...' : 'Optimize with AI'}
    </button>
  );
};

/**
 * AIBenchmarkBadge - Show percentile ranking
 * 
 * Usage:
 * <AIBenchmarkBadge percentile={85} comparison="Top 15% for EV charging" />
 */
export interface AIBenchmarkBadgeProps {
  percentile: number;
  comparison: string;
  className?: string;
}

export const AIBenchmarkBadge: React.FC<AIBenchmarkBadgeProps> = ({
  percentile,
  comparison,
  className = ''
}) => {
  // Color based on percentile
  const color = percentile >= 80 ? 'emerald' :
                percentile >= 60 ? 'blue' :
                percentile >= 40 ? 'yellow' :
                'gray';

  return (
    <div className={`bg-${color}-50 border border-${color}-300 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Sparkles className={`w-4 h-4 text-${color}-600`} />
        <span className={`text-sm font-semibold text-${color}-900`}>
          {percentile}th Percentile
        </span>
      </div>
      <div className={`text-xs text-${color}-700 mt-1`}>
        {comparison}
      </div>
    </div>
  );
};

export default AIInsightBadge;
