/**
 * QuestionCard.tsx
 * 
 * Container for grouping related form questions.
 * Provides consistent spacing and styling.
 * 
 * @created December 2025
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface QuestionCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight' | 'warning';
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuestionCard({
  children,
  title,
  description,
  icon,
  variant = 'default',
  className = '',
}: QuestionCardProps) {
  const variantClasses = {
    default: 'bg-white border-slate-200',
    highlight: 'bg-purple-50 border-purple-200',
    warning: 'bg-amber-50 border-amber-200',
  };
  
  return (
    <div className={`rounded-2xl border-2 p-6 ${variantClasses[variant]} ${className}`}>
      {/* Header */}
      {(title || icon) && (
        <div className="flex items-start gap-3 mb-4">
          {icon && (
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            {title && (
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

export default QuestionCard;
