/**
 * FloatingWidget.tsx
 * 
 * Floating action button positioned at the right edge of the screen.
 * Use INSTEAD of sidebar navigation.
 * 
 * DO NOT use fixed sidebars - they squeeze content.
 * 
 * @created December 2025
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface FloatingWidgetProps {
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  onClick: () => void;
  position: number;  // Stack position (0 = bottom, 1 = above, etc.)
  isActive?: boolean;
  variant?: 'default' | 'success' | 'warning';
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FloatingWidget({
  icon,
  label,
  badge,
  onClick,
  position,
  isActive = false,
  variant = 'default',
  className = '',
}: FloatingWidgetProps) {
  const bottomPosition = 24 + (position * 64);  // 64px spacing between widgets
  
  const variantClasses = {
    default: isActive 
      ? 'border-purple-400 bg-purple-50' 
      : 'border-purple-200 bg-white hover:border-purple-400',
    success: isActive
      ? 'border-emerald-400 bg-emerald-50'
      : 'border-emerald-200 bg-white hover:border-emerald-400',
    warning: isActive
      ? 'border-amber-400 bg-amber-50'
      : 'border-amber-200 bg-white hover:border-amber-400',
  };
  
  const badgeColors = {
    default: 'bg-purple-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
  };
  
  return (
    <button
      onClick={onClick}
      className={`fixed right-6 z-40 flex items-center gap-2 px-4 py-3
                 border-2 rounded-full shadow-lg
                 hover:shadow-xl transition-all group
                 ${variantClasses[variant]} ${className}`}
      style={{ bottom: `${bottomPosition}px` }}
    >
      <span className={`${isActive ? 'text-purple-600' : 'text-purple-500'} group-hover:text-purple-600`}>
        {icon}
      </span>
      <span className={`font-semibold ${isActive ? 'text-purple-700' : 'text-gray-700'} group-hover:text-purple-700`}>
        {label}
      </span>
      {badge !== undefined && badge !== null && (
        <span className={`flex items-center justify-center min-w-[24px] h-6 px-1.5 
                        ${badgeColors[variant]} text-white text-xs font-bold rounded-full`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export default FloatingWidget;
